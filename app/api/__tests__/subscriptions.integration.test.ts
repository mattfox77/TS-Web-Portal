import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../payments/subscriptions/route';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@cloudflare/next-on-pages', () => ({
  getRequestContext: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getUserClientId: vi.fn(),
}));

vi.mock('@/lib/paypal-subscriptions', () => ({
  createPayPalSubscriptionPlan: vi.fn(),
  createPayPalSubscription: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getUserClientId } from '@/lib/auth';
import { createPayPalSubscriptionPlan, createPayPalSubscription } from '@/lib/paypal-subscriptions';

describe('Subscriptions API Integration Tests', () => {
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

  describe('GET /api/payments/subscriptions', () => {
    it('should return unauthorized when user is not authenticated', async () => {
      (auth as any).mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should fetch subscriptions for authenticated user', async () => {
      const mockSubscriptions = [
        {
          id: 'sub_1',
          client_id: 'client_123',
          service_package_id: 'pkg_1',
          paypal_subscription_id: 'I-123',
          status: 'active',
          billing_cycle: 'monthly',
          start_date: '2024-01-01',
          next_billing_date: '2024-02-01',
          cancel_at_period_end: 0,
          package_name: 'Basic Support',
          package_description: 'Basic support package',
          price_monthly: 99.99,
          price_annual: 999.99,
          features: JSON.stringify(['Feature 1', 'Feature 2']),
        },
      ];

      mockDb.prepare = vi.fn((query: string) => {
        return {
          bind: vi.fn(() => ({
            all: vi.fn(() => Promise.resolve({ results: mockSubscriptions })),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscriptions).toBeDefined();
      expect(data.subscriptions.length).toBe(1);
      expect(data.subscriptions[0].service_package).toBeDefined();
      expect(data.subscriptions[0].service_package.features).toEqual(['Feature 1', 'Feature 2']);
    });
  });

  describe('POST /api/payments/subscriptions', () => {
    it('should create subscription successfully', async () => {
      const subscriptionData = {
        service_package_id: 'pkg_1',
        billing_cycle: 'monthly',
      };

      const mockServicePackage = {
        id: 'pkg_1',
        name: 'Basic Support',
        description: 'Basic support package',
        price_monthly: 99.99,
        price_annual: 999.99,
        features: JSON.stringify(['Feature 1', 'Feature 2']),
        is_active: 1,
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id, name, description')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(mockServicePackage)),
            })),
          };
        }
        if (query.includes('SELECT id, status FROM subscriptions')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)), // No existing subscription
            })),
          };
        }
        if (query.includes('INSERT INTO subscriptions')) {
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

      (createPayPalSubscriptionPlan as any).mockResolvedValue('plan_123');
      (createPayPalSubscription as any).mockResolvedValue({
        subscription_id: 'I-123',
        approve_url: 'https://paypal.com/approve/I-123',
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.subscription_id).toBeDefined();
      expect(data.paypal_subscription_id).toBe('I-123');
      expect(data.approve_url).toBe('https://paypal.com/approve/I-123');
      expect(data.status).toBe('pending');
    });

    it('should prevent duplicate active subscriptions', async () => {
      const subscriptionData = {
        service_package_id: 'pkg_1',
        billing_cycle: 'monthly',
      };

      const mockServicePackage = {
        id: 'pkg_1',
        name: 'Basic Support',
        is_active: 1,
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id, name, description')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(mockServicePackage)),
            })),
          };
        }
        if (query.includes('SELECT id, status FROM subscriptions')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve({ id: 'sub_existing', status: 'active' })),
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already have an active subscription');
    });

    it('should return 404 for inactive service package', async () => {
      const subscriptionData = {
        service_package_id: 'pkg_inactive',
        billing_cycle: 'monthly',
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id, name, description')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)), // Package not found or inactive
            })),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
          })),
        };
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found or inactive');
    });

    it('should validate billing cycle', async () => {
      const invalidData = {
        service_package_id: 'pkg_1',
        billing_cycle: 'invalid',
      };

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should create PayPal subscription plan and subscription', async () => {
      const subscriptionData = {
        service_package_id: 'pkg_1',
        billing_cycle: 'annual',
      };

      const mockServicePackage = {
        id: 'pkg_1',
        name: 'Premium Support',
        description: 'Premium support package',
        price_monthly: 199.99,
        price_annual: 1999.99,
        features: JSON.stringify(['Feature 1', 'Feature 2', 'Feature 3']),
        is_active: 1,
      };

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id, name, description')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(mockServicePackage)),
            })),
          };
        }
        if (query.includes('SELECT id, status FROM subscriptions')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)),
            })),
          };
        }
        if (query.includes('INSERT INTO subscriptions')) {
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

      (createPayPalSubscriptionPlan as any).mockResolvedValue('plan_annual_123');
      (createPayPalSubscription as any).mockResolvedValue({
        subscription_id: 'I-ANNUAL-123',
        approve_url: 'https://paypal.com/approve/I-ANNUAL-123',
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(createPayPalSubscriptionPlan).toHaveBeenCalledWith(
        mockEnv,
        expect.objectContaining({
          id: 'pkg_1',
          name: 'Premium Support',
        }),
        'annual'
      );
      expect(createPayPalSubscription).toHaveBeenCalledWith(
        mockEnv,
        'plan_annual_123',
        'client_123'
      );
    });

    it('should store subscription with pending status', async () => {
      const subscriptionData = {
        service_package_id: 'pkg_1',
        billing_cycle: 'monthly',
      };

      const mockServicePackage = {
        id: 'pkg_1',
        name: 'Basic Support',
        is_active: 1,
      };

      let insertedStatus: string | null = null;

      mockDb.prepare = vi.fn((query: string) => {
        if (query.includes('SELECT id, name, description')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(mockServicePackage)),
            })),
          };
        }
        if (query.includes('SELECT id, status FROM subscriptions')) {
          return {
            bind: vi.fn(() => ({
              first: vi.fn(() => Promise.resolve(null)),
            })),
          };
        }
        if (query.includes('INSERT INTO subscriptions')) {
          return {
            bind: vi.fn((...args: any[]) => {
              insertedStatus = args[4]; // status is the 5th parameter
              return {
                run: vi.fn(() => Promise.resolve({ success: true })),
              };
            }),
          };
        }
        return {
          bind: vi.fn(() => ({
            first: vi.fn(() => Promise.resolve(null)),
            run: vi.fn(() => Promise.resolve({ success: true })),
          })),
        };
      });

      (createPayPalSubscriptionPlan as any).mockResolvedValue('plan_123');
      (createPayPalSubscription as any).mockResolvedValue({
        subscription_id: 'I-123',
        approve_url: 'https://paypal.com/approve/I-123',
      });

      const request = new NextRequest('http://localhost:3000/api/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(insertedStatus).toBe('pending');
    });
  });
});
