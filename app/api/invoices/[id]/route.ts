import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { handleError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { Invoice, InvoiceItem } from '@/types';
import { sql } from "@vercel/postgres";

// GET /api/invoices/[id] - Get invoice details
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
    // Get client ID for the user
    const clientId = await getUserClientId(userId);

    // Fetch invoice
    const invoice = await db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(params.id)
      .first<Invoice>();

    if (!invoice) {
      throw new NotFoundError('Invoice');
    }

    // Verify user has access to this invoice
    if (invoice.client_id !== clientId) {
      throw new ForbiddenError('You do not have access to this invoice');
    }

    // Fetch invoice items
    const { results: items } = await db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at')
      .bind(params.id)
      .all<InvoiceItem>();

    // Fetch payment information if invoice is paid
    let payment = null;
    if (invoice.status === 'paid') {
      payment = await db
        .prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1')
        .bind(params.id)
        .first();
    }

    return NextResponse.json({
      invoice: {
        ...invoice,
        items,
      },
      payment,
    });
  } catch (error) {
    return handleError(error);
  }
}
