import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../documents/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

describe('Documents API Integration Tests', () => {
  let mockDb: any;
  let mockR2: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      prepare: vi.fn((query: string) => ({
        bind: vi.fn((...args: any[]) => ({
          first: vi.fn(() => Promise.resolve(null)),
          all: vi.fn(() => Promise.resolve({ results: [] })),
          run: vi.fn(() => Promise.resolve({ success: true })),
        })),
      })),
    };

    mockR2 = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    mockEnv = {
      DB: mockDb,
      DOCUMENTS: mockR2,
    };

    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (getRequestContext as any).mockReturnValue({ env: mockEnv });
  });

  describe('GET /api/documents', () => {
    it('should return unauthorized when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/documents');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch documents for authenticated user', async () => {
      const mockDocuments = [
        {
          id: 'doc_1',
          filename: 'test.pdf',
          file_size: 1024,
          file_type: 'application/pdf',
          storage_key: 'client_123/test.pdf',
          uploaded_at: '2024-01-01T00:00:00.000Z',
        },
      ];

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
            all: vi.fn(() => Promise.resolve({ results: mockDocuments })),
          })),
        };
      });

      mockR2.get.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/documents');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toBeDefined();
      expect(data.documents.length).toBeGreaterThan(0);
    });

    it('should filter documents by project', async () => {
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
            all: vi.fn(() => Promise.resolve({ results: [] })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/documents?project_id=project_123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalled();
    });
  });

  describe('POST /api/documents', () => {
    it('should upload document successfully', async () => {
      const fileContent = 'test file content';
      const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('INSERT INTO documents')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('INSERT INTO activity_log')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
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

      mockR2.put.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Document uploaded successfully');
      expect(data.document).toBeDefined();
      expect(mockR2.put).toHaveBeenCalled();
    });

    it('should reject file exceeding size limit', async () => {
      // Create a file larger than 50MB
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);

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

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('50MB');
    });

    it('should reject disallowed file types', async () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      
      const formData = new FormData();
      formData.append('file', file);

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

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('not allowed');
    });

    it('should associate document with project when provided', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', 'project_123');

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('SELECT id FROM projects')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ id: 'project_123' })),
            })),
          };
        }
        if (query.includes('INSERT INTO documents')) {
          return {
            bind: vi.fn((...args: any[]) => {
              // Verify project_id is included
              const projectId = args[2];
              expect(projectId).toBe('project_123');
              
              return {
                run: vi.fn(() => Promise.resolve({ success: true })),
              };
            }),
          };
        }
        if (query.includes('INSERT INTO activity_log')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
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

      mockR2.put.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should return 404 when project does not belong to client', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', 'other_project');

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('SELECT id FROM projects')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)), // Project not found
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should log document upload activity', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', file);

      let activityLogged = false;

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT client_id FROM users')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ client_id: 'client_123' })),
            })),
          };
        }
        if (query.includes('INSERT INTO documents')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('INSERT INTO activity_log')) {
          activityLogged = true;
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
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

      mockR2.put.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/documents', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      expect(activityLogged).toBe(true);
    });
  });
});
