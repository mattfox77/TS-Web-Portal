import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError, NotFoundError } from '@/lib/errors';
import { Invoice, InvoiceItem, Client } from '@/types';
import { sendEmail, getInvoiceEmail, shouldSendNotification } from '@/lib/email';
import { generateInvoiceHTML } from '@/lib/pdf-generator';
import { sql } from "@vercel/postgres";

// POST /api/admin/invoices/send-email - Send invoice email (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const body = await request.json();
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // Fetch invoice
    const invoice = await db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(invoice_id)
      .first<Invoice>();

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Fetch invoice items
    const { results: items } = await db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ?')
      .bind(invoice_id)
      .all<InvoiceItem>();

    // Fetch client
    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(invoice.client_id)
      .first<Client>();

    if (!client) {
      throw new NotFoundError('Client');
    }

    // Generate invoice HTML for PDF attachment
    const invoiceHTML = generateInvoiceHTML({
      invoice: {
        ...invoice,
        items,
      },
      client,
    });

    // Convert HTML to buffer (in production, this would be actual PDF)
    const pdfBuffer = Buffer.from(invoiceHTML, 'utf-8');

    // Get primary user for the client to check notification preferences
    const primaryUser = await db
      .prepare('SELECT id FROM users WHERE client_id = ? LIMIT 1')
      .bind(client.id)
      .first<{ id: string }>();

    // Check notification preferences
    const shouldNotify = primaryUser 
      ? await shouldSendNotification(db, primaryUser.id, 'invoices')
      : true; // Default to sending if no user found

    if (shouldNotify) {
      // Get email template
      const appUrl = env.APP_URL || 'https://portal.techsupportcs.com';
      const emailTemplate = getInvoiceEmail(invoice, appUrl);

      // Send email with PDF attachment
      await sendEmail(
        env,
        client.email,
        emailTemplate,
        [
          {
            filename: `invoice-${invoice.invoice_number}.html`,
            content: pdfBuffer,
          },
        ]
      );
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await db
        .prepare('UPDATE invoices SET status = ? WHERE id = ?')
        .bind('sent', invoice_id)
        .run();
    }

    return NextResponse.json({
      message: 'Invoice email sent successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}
