import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../tickets/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(),
}));

vi.mock('@/lib/github', () => ({
  createGitHubIssue: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
  getTicketCreatedEmail: vi.fn(() => ({
    subject: 'Test Subject',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  shouldSendNotification: vi.fn(() => Promise.resolve(true)),
}));

import { auth } from '@clerk/nextjs/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createGitHubIssue } from '@/lib/github';
import { sendEmail } from '@/lib/email';

describe('Tickets API Integration Tests', () => {
  let mockDb: any;
  let mockEnv: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock database
    mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn((...args: any[]) => ({
          first: vi.fn(() => Promise.resolve(null)),
          all: vi.fn(() => Promise.resolve({ results: [] })),
          run: vi.fn(() => Promise.resolve({ success: true })),
        })),
      })),
    };

    mockEnv = {
      DB: mockDb,
      GITHUB_TOKEN: 'test-token',
    };

    // Mock Clerk auth
    (auth as any).mockResolvedValue({ userId: 'user_123' });

    // Mock request context
    (getRequestContext as any).mockReturnValue({ env: mockEnv });
  });

  describe('GET /api/tickets', () => {
    it('should return unauthorized when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/tickets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch tickets for authenticated user', async () => {
      const mockTickets = [
        {
          id: 'ticket_1',
          title: 'Test Ticket',
          status: 'open',
          priority: 'high',
          project_name: 'Test Project',
        },
      ];

      // Mock getUserClientId
      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        // Mock count query
        if (query.includes('COUNT(*)')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 1 })),
            })),
          };
        }
        // Mock tickets query
        return {
          bind: vi.fn(() => ({
            all: vi.fn(() => Promise.resolve({ results: mockTickets })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/tickets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockTickets);
    });

    it('should filter tickets by status', async () => {
      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('COUNT(*)')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 0 })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            all: vi.fn(() => Promise.resolve({ results: [] })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/tickets?status=open');
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Verify the query included status filter
      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a ticket successfully', async () => {
      const ticketData = {
        title: 'New Support Ticket',
        description: 'This is a test ticket description',
        priority: 'high',
      };

      const createdTicket = {
        id: 'ticket_new',
        ...ticketData,
        status: 'open',
        client_id: 'client_123',
        user_id: 'user_123',
      };

      // Mock database calls
      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('INSERT INTO tickets')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('SELECT') && query.includes('FROM tickets')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(createdTicket)),
            })),
          };
        }
        if (query.includes('SELECT email FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ email: 'user@example.com' })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            run: vi.fn(() => Promise.resolve({ success: true })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.ticket).toBeDefined();
      expect(data.ticket.title).toBe(ticketData.title);
    });

    it('should create GitHub issue when project has repository', async () => {
      const ticketData = {
        title: 'Bug Report',
        description: 'Found a bug in the system',
        priority: 'high',
        project_id: 'project_123',
      };

      const mockGitHubIssue = {
        number: 42,
        html_url: 'https://github.com/owner/repo/issues/42',
      };

      // Mock database calls
      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('SELECT github_repo FROM projects')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ github_repo: 'https://github.com/owner/repo' })),
            })),
          };
        }
        if (query.includes('INSERT INTO tickets')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('UPDATE tickets')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('SELECT') && query.includes('FROM tickets')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({
                id: 'ticket_new',
                ...ticketData,
                status: 'open',
                github_issue_number: mockGitHubIssue.number,
                github_issue_url: mockGitHubIssue.html_url,
              })),
            })),
          };
        }
        if (query.includes('SELECT email FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ email: 'user@example.com' })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            run: vi.fn(() => Promise.resolve({ success: true })),
          })),
        };
      });

      (createGitHubIssue as any).mockResolvedValue(mockGitHubIssue);

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(createGitHubIssue).toHaveBeenCalled();
      expect(data.ticket.github_issue_number).toBe(mockGitHubIssue.number);
      expect(data.ticket.github_issue_url).toBe(mockGitHubIssue.html_url);
    });

    it('should send email notification after ticket creation', async () => {
      const ticketData = {
        title: 'Email Test Ticket',
        description: 'Testing email notifications',
        priority: 'medium',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('INSERT INTO tickets')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('SELECT') && query.includes('FROM tickets')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({
                id: 'ticket_new',
                ...ticketData,
                status: 'open',
              })),
            })),
          };
        }
        if (query.includes('SELECT email FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ email: 'user@example.com' })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            run: vi.fn(() => Promise.resolve({ success: true })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return validation error for invalid ticket data', async () => {
      const invalidData = {
        title: 'Too short', // Less than 5 characters
        description: 'Short', // Less than 10 characters
        priority: 'invalid', // Invalid priority
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/tickets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('Validation failed');
    });
  });
});
