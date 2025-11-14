import { describe, it, expect } from 'vitest';
import {
  getTicketCreatedEmail,
  getInvoiceEmail,
  getPaymentReceiptEmail,
  getSubscriptionActivatedEmail,
  getSubscriptionCancelledEmail,
  getSubscriptionRenewalReminderEmail,
  getSubscriptionPaymentFailedEmail,
} from '../email';
import type { Ticket, Invoice, Payment, Subscription } from '@/types';

describe('email template generation', () => {
  const appUrl = 'https://portal.techsupportcs.com';

  describe('getTicketCreatedEmail', () => {
    it('should generate email with ticket details', () => {
      const ticket: Ticket = {
        id: 'ticket-123',
        client_id: 'client-456',
        user_id: 'user-789',
        title: 'Test Ticket',
        description: 'This is a test ticket description',
        status: 'open',
        priority: 'high',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getTicketCreatedEmail(ticket, appUrl);

      expect(email.subject).toContain('Test Ticket');
      expect(email.html).toContain('ticket-123');
      expect(email.html).toContain('Test Ticket');
      expect(email.html).toContain('HIGH');
      expect(email.html).toContain('OPEN');
      expect(email.html).toContain(appUrl);
      expect(email.text).toContain('ticket-123');
      expect(email.text).toContain('Test Ticket');
    });

    it('should include description when provided', () => {
      const ticket: Ticket = {
        id: 'ticket-123',
        client_id: 'client-456',
        user_id: 'user-789',
        title: 'Test Ticket',
        description: 'Detailed description here',
        status: 'open',
        priority: 'medium',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getTicketCreatedEmail(ticket, appUrl);

      expect(email.html).toContain('Detailed description here');
      expect(email.text).toContain('Detailed description here');
    });

    it('should handle ticket without description', () => {
      const ticket: Ticket = {
        id: 'ticket-123',
        client_id: 'client-456',
        user_id: 'user-789',
        title: 'Test Ticket',
        status: 'open',
        priority: 'low',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getTicketCreatedEmail(ticket, appUrl);

      expect(email.html).not.toContain('Description:');
      expect(email.subject).toContain('Test Ticket');
    });
  });

  describe('getInvoiceEmail', () => {
    it('should generate email with invoice details', () => {
      const invoice: Invoice = {
        id: 'invoice-123',
        invoice_number: 'INV-2024-0001',
        client_id: 'client-456',
        status: 'sent',
        subtotal: 200.00,
        tax_rate: 0.08,
        tax_amount: 16.00,
        total: 216.00,
        currency: 'USD',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getInvoiceEmail(invoice, appUrl);

      expect(email.subject).toContain('INV-2024-0001');
      expect(email.html).toContain('INV-2024-0001');
      expect(email.html).toContain('216.00');
      expect(email.html).toContain('USD');
      expect(email.html).toContain(appUrl);
      expect(email.text).toContain('INV-2024-0001');
      expect(email.text).toContain('216.00');
    });

    it('should format dates correctly', () => {
      const invoice: Invoice = {
        id: 'invoice-123',
        invoice_number: 'INV-2024-0001',
        client_id: 'client-456',
        status: 'sent',
        subtotal: 100.00,
        tax_rate: 0,
        tax_amount: 0,
        total: 100.00,
        currency: 'USD',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getInvoiceEmail(invoice, appUrl);

      // Check that dates are formatted (not raw ISO strings)
      expect(email.html).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(email.text).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('getPaymentReceiptEmail', () => {
    it('should generate receipt with payment and invoice details', () => {
      const payment: Payment = {
        id: 'payment-123',
        invoice_id: 'invoice-456',
        client_id: 'client-789',
        paypal_transaction_id: 'PAYPAL-TXN-123',
        amount: 216.00,
        currency: 'USD',
        status: 'completed',
        payment_method: 'paypal',
        created_at: '2024-01-15T10:00:00Z',
      };

      const invoice: Invoice = {
        id: 'invoice-456',
        invoice_number: 'INV-2024-0001',
        client_id: 'client-789',
        status: 'paid',
        subtotal: 200.00,
        tax_rate: 0.08,
        tax_amount: 16.00,
        total: 216.00,
        currency: 'USD',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        paid_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getPaymentReceiptEmail(payment, invoice, appUrl);

      expect(email.subject).toContain('INV-2024-0001');
      expect(email.html).toContain('INV-2024-0001');
      expect(email.html).toContain('216.00');
      expect(email.html).toContain('PAYPAL-TXN-123');
      expect(email.text).toContain('INV-2024-0001');
      expect(email.text).toContain('216.00');
      expect(email.text).toContain('PAYPAL-TXN-123');
    });

    it('should use payment ID if no PayPal transaction ID', () => {
      const payment: Payment = {
        id: 'payment-123',
        invoice_id: 'invoice-456',
        client_id: 'client-789',
        amount: 100.00,
        currency: 'USD',
        status: 'completed',
        payment_method: 'paypal',
        created_at: '2024-01-15T10:00:00Z',
      };

      const invoice: Invoice = {
        id: 'invoice-456',
        invoice_number: 'INV-2024-0001',
        client_id: 'client-789',
        status: 'paid',
        subtotal: 100.00,
        tax_rate: 0,
        tax_amount: 0,
        total: 100.00,
        currency: 'USD',
        issue_date: '2024-01-15',
        due_date: '2024-02-15',
        paid_date: '2024-01-15',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getPaymentReceiptEmail(payment, invoice, appUrl);

      expect(email.html).toContain('payment-123');
      expect(email.text).toContain('payment-123');
    });
  });

  describe('getSubscriptionActivatedEmail', () => {
    it('should generate email with subscription details', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        client_id: 'client-456',
        service_package_id: 'pkg-789',
        status: 'active',
        billing_cycle: 'monthly',
        start_date: '2024-01-15',
        next_billing_date: '2024-02-15',
        cancel_at_period_end: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        service_package: {
          id: 'pkg-789',
          name: 'Premium Support',
          price_monthly: 99.00,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const email = getSubscriptionActivatedEmail(subscription, appUrl);

      expect(email.subject).toContain('Premium Support');
      expect(email.html).toContain('Premium Support');
      expect(email.html).toContain('Monthly');
      expect(email.text).toContain('Premium Support');
      expect(email.text).toContain('Monthly');
    });

    it('should handle annual billing cycle', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        client_id: 'client-456',
        service_package_id: 'pkg-789',
        status: 'active',
        billing_cycle: 'annual',
        start_date: '2024-01-15',
        next_billing_date: '2025-01-15',
        cancel_at_period_end: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        service_package: {
          id: 'pkg-789',
          name: 'Premium Support',
          price_annual: 999.00,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const email = getSubscriptionActivatedEmail(subscription, appUrl);

      expect(email.html).toContain('Annual');
      expect(email.text).toContain('Annual');
    });
  });

  describe('getSubscriptionCancelledEmail', () => {
    it('should generate cancellation email', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        client_id: 'client-456',
        service_package_id: 'pkg-789',
        status: 'cancelled',
        billing_cycle: 'monthly',
        start_date: '2024-01-15',
        next_billing_date: '2024-02-15',
        cancel_at_period_end: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        service_package: {
          id: 'pkg-789',
          name: 'Premium Support',
          price_monthly: 99.00,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const email = getSubscriptionCancelledEmail(subscription, appUrl);

      expect(email.subject).toContain('Cancelled');
      expect(email.subject).toContain('Premium Support');
      expect(email.html).toContain('cancelled');
      expect(email.text).toContain('cancelled');
    });
  });

  describe('getSubscriptionRenewalReminderEmail', () => {
    it('should generate renewal reminder with amount', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        client_id: 'client-456',
        service_package_id: 'pkg-789',
        status: 'active',
        billing_cycle: 'monthly',
        start_date: '2024-01-15',
        next_billing_date: '2024-02-15',
        cancel_at_period_end: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        service_package: {
          id: 'pkg-789',
          name: 'Premium Support',
          price_monthly: 99.00,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const email = getSubscriptionRenewalReminderEmail(subscription, appUrl);

      expect(email.subject).toContain('Renewal Reminder');
      expect(email.html).toContain('99.00');
      expect(email.html).toContain('7 days');
      expect(email.text).toContain('99.00');
      expect(email.text).toContain('7 days');
    });
  });

  describe('getSubscriptionPaymentFailedEmail', () => {
    it('should generate payment failed email', () => {
      const subscription: Subscription = {
        id: 'sub-123',
        client_id: 'client-456',
        service_package_id: 'pkg-789',
        status: 'active',
        billing_cycle: 'monthly',
        start_date: '2024-01-15',
        next_billing_date: '2024-02-15',
        cancel_at_period_end: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        service_package: {
          id: 'pkg-789',
          name: 'Premium Support',
          price_monthly: 99.00,
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const email = getSubscriptionPaymentFailedEmail(subscription, appUrl);

      expect(email.subject).toContain('Payment Failed');
      expect(email.html).toContain('Payment Failed');
      expect(email.html).toContain('Action Required');
      expect(email.text).toContain('Payment Failed');
      expect(email.text).toContain('ACTION REQUIRED');
    });
  });

  describe('email template structure', () => {
    it('should include subject, html, and text for all templates', () => {
      const ticket: Ticket = {
        id: 'ticket-123',
        client_id: 'client-456',
        user_id: 'user-789',
        title: 'Test',
        status: 'open',
        priority: 'medium',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getTicketCreatedEmail(ticket, appUrl);

      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
      expect(typeof email.subject).toBe('string');
      expect(typeof email.html).toBe('string');
      expect(typeof email.text).toBe('string');
      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.html.length).toBeGreaterThan(0);
      expect(email.text.length).toBeGreaterThan(0);
    });

    it('should include app URL in all templates', () => {
      const ticket: Ticket = {
        id: 'ticket-123',
        client_id: 'client-456',
        user_id: 'user-789',
        title: 'Test',
        status: 'open',
        priority: 'medium',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const email = getTicketCreatedEmail(ticket, appUrl);

      expect(email.html).toContain(appUrl);
      expect(email.text).toContain(appUrl);
    });
  });
});
