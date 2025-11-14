import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../invoices/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getUserClientId: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/errors', () => ({
  handleError: vi.fn((error) => {
    if (error.statusCode) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }),
  NotFoundError: class NotFoundError extends Error {
    statusCode = 404;
    constructor(resource: string) {
      super(`${resource} not found`);
    }
  },
}));

import { auth } from '@clerk/nextjs/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getUserClientId, requireAdmin } from '@/lib/auth';

describe('Invoices API Integration Tests', () => {
  let mockDb: any;
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

    mockEnv = {
      DB: mockDb,
    };

    (auth as any).mockResolvedValue({ userId: 'user_123' });
    (getRequestContext as any).mockReturnValue({ env: mockEnv });
    (getUserClientId as any).mockResolvedValue('client_123');
  });

  describe('GET /api/invoices', () => {
    it('should return unauthorized when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/invoices');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch invoices for authenticated user', async () => {
      const mockInvoices = [
        {
          id: 'invoice_1',
          invoice_number: 'INV-2024-0001',
          status: 'paid',
          total: 1000.00,
          issue_date: '2024-01-01',
        },
      ];

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('COUNT(*)')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 1 })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            all: vi.fn(() => Promise.resolve({ results: mockInvoices })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/invoices');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockInvoices);
    });

    it('should filter invoices by status', async () => {
      mockDb.prepare = vi.fn((query: string) => {
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

      const request = new NextRequest('http://localhost:3000/api/invoices?status=paid');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('should filter invoices by date range', async () => {
      mockDb.prepare = vi.fn((query: string) => {
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

      const request = new NextRequest(
        'http://localhost:3000/api/invoices?date_from=2024-01-01&date_to=2024-12-31'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/invoices', () => {
    beforeEach(() => {
      (requireAdmin as any).mockResolvedValue('admin_123');
    });

    it('should create invoice with line items', async () => {
      const invoiceData = {
        client_id: 'client_123',
        line_items: [
          {
            description: 'Web Development Services',
            quantity: 10,
            unit_price: 100,
          },
          {
            description: 'Server Maintenance',
            quantity: 1,
            unit_price: 200,
          },
        ],
        due_date: '2024-12-31T00:00:00.000Z',
        notes: 'Payment due within 30 days',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id FROM clients')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ id: 'client_123' })),
            })),
          };
        }
        if (query.includes('COUNT(*) as count FROM invoices')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 0 })),
            })),
          };
        }
        if (query.includes('INSERT INTO invoices')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('INSERT INTO invoice_items')) {
          return {
            bind: vi.fn(() => ({
              run: vi.fn(() => Promise.resolve({ success: true })),
            })),
          };
        }
        if (query.includes('SELECT * FROM invoices WHERE id')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({
                id: 'invoice_new',
                invoice_number: 'INV-2024-0001',
                client_id: 'client_123',
                status: 'draft',
                subtotal: 1200,
                tax_rate: 0.08,
                tax_amount: 96,
                total: 1296,
                currency: 'USD',
              })),
            })),
          };
        }
        if (query.includes('SELECT * FROM invoice_items')) {
          return {
            bind: vi.fn(() => ({
              all: vi.fn(() => Promise.resolve({
                results: invoiceData.line_items.map((item, i) => ({
                  id: `item_${i}`,
                  invoice_id: 'invoice_new',
                  ...item,
                  amount: item.quantity * item.unit_price,
                })),
              })),
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

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.invoice).toBeDefined();
      expect(data.invoice.invoice_number).toBe('INV-2024-0001');
      expect(data.invoice.total).toBe(1296); // 1200 + 8% tax
    });

    it('should calculate invoice totals correctly', async () => {
      const invoiceData = {
        client_id: 'client_123',
        line_items: [
          { description: 'Service A', quantity: 2, unit_price: 50 },
          { description: 'Service B', quantity: 1, unit_price: 100 },
        ],
        due_date: '2024-12-31T00:00:00.000Z',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id FROM clients')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ id: 'client_123' })),
            })),
          };
        }
        if (query.includes('COUNT(*) as count FROM invoices')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 0 })),
            })),
          };
        }
        if (query.includes('INSERT INTO invoices')) {
          return {
            bind: vi.fn((...args: any[]) => {
              // Verify calculated values
              const subtotal = args[4];
              const taxAmount = args[6];
              const total = args[7];
              
              expect(subtotal).toBe(200); // 2*50 + 1*100
              expect(taxAmount).toBe(16); // 200 * 0.08
              expect(total).toBe(216); // 200 + 16
              
              return {
                run: vi.fn(() => Promise.resolve({ success: true })),
              };
            }),
          };
        }
        if (query.includes('SELECT * FROM invoices WHERE id')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({
                id: 'invoice_new',
                invoice_number: 'INV-2024-0001',
                subtotal: 200,
                tax_amount: 16,
                total: 216,
              })),
            })),
          };
        }
        if (query.includes('SELECT * FROM invoice_items')) {
          return {
            bind: vi.fn(() => ({
              all: vi.fn(() => Promise.resolve({ results: [] })),
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

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should generate sequential invoice numbers', async () => {
      const invoiceData = {
        client_id: 'client_123',
        line_items: [
          { description: 'Service', quantity: 1, unit_price: 100 },
        ],
        due_date: '2024-12-31T00:00:00.000Z',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id FROM clients')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ id: 'client_123' })),
            })),
          };
        }
        if (query.includes('COUNT(*) as count FROM invoices')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ count: 5 })), // 5 existing invoices
            })),
          };
        }
        if (query.includes('INSERT INTO invoices')) {
          return {
            bind: vi.fn((...args: any[]) => {
              const invoiceNumber = args[1];
              const year = new Date().getFullYear();
              expect(invoiceNumber).toBe(`INV-${year}-0006`); // Next number should be 6
              
              return {
                run: vi.fn(() => Promise.resolve({ success: true })),
              };
            }),
          };
        }
        if (query.includes('SELECT * FROM invoices WHERE id')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({
                id: 'invoice_new',
                invoice_number: `INV-${new Date().getFullYear()}-0006`,
              })),
            })),
          };
        }
        if (query.includes('SELECT * FROM invoice_items')) {
          return {
            bind: vi.fn(() => ({
              all: vi.fn(() => Promise.resolve({ results: [] })),
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

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should return 404 when client does not exist', async () => {
      const invoiceData = {
        client_id: 'nonexistent_client',
        line_items: [
          { description: 'Service', quantity: 1, unit_price: 100 },
        ],
        due_date: '2024-12-31T00:00:00.000Z',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id FROM clients')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)), // Client not found
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});
