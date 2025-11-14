import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId, requireAdmin } from '@/lib/auth';
import { handleError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { Invoice, InvoiceItem, Client } from '@/types';
import { generateInvoiceHTML } from '@/lib/pdf-generator';
import { sql } from "@vercel/postgres";

// GET /api/invoices/[id]/pdf - Generate and download invoice PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Migrated to Vercel Postgres
    // Check if user is admin or owns the invoice
    let clientId: string;
    let isAdmin = false;
    
    try {
      await requireAdmin(request);
      isAdmin = true;
    } catch {
      // Not admin, check if user owns the invoice
      clientId = await getUserClientId(userId);
    }

    // Fetch invoice
    const invoice = await db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(params.id)
      .first<Invoice>();

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Verify access if not admin
    if (!isAdmin) {
      if (invoice.client_id !== clientId!) {
        throw new ForbiddenError('You do not have access to this invoice');
      }
    }

    // Fetch invoice items
    const { results: items } = await db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at')
      .bind(params.id)
      .all<InvoiceItem>();

    // Fetch client information
    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(invoice.client_id)
      .first<Client>();

    if (!client) {
      throw new NotFoundError('Client');
    }

    // Generate HTML (in production, this would be converted to PDF)
    const html = generateInvoiceHTML({
      invoice: {
        ...invoice,
        items,
      },
      client,
    });

    // Return HTML with appropriate headers
    // In production, you would return actual PDF bytes
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.html"`,
        // For actual PDF, use:
        // 'Content-Type': 'application/pdf',
        // 'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
