import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { handleError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { Payment, Invoice, Client } from '@/types';
import { generateReceiptPDF } from '@/lib/pdf-generator';
import { sql } from "@vercel/postgres";

// GET /api/payments/[id]/receipt - Download payment receipt as PDF
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

    // Fetch payment
    const payment = await db
      .prepare('SELECT * FROM payments WHERE id = ?')
      .bind(params.id)
      .first<Payment>();

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Verify payment belongs to user's client
    if (payment.client_id !== clientId) {
      throw new ForbiddenError('You do not have access to this payment');
    }

    // Fetch client information
    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(clientId)
      .first<Client>();

    if (!client) {
      throw new NotFoundError('Client');
    }

    // Fetch invoice if payment is associated with one
    let invoice: Invoice | undefined;
    if (payment.invoice_id) {
      invoice = await db
        .prepare('SELECT * FROM invoices WHERE id = ?')
        .bind(payment.invoice_id)
        .first<Invoice>() || undefined;
    }

    // Generate receipt PDF
    const pdfBuffer = await generateReceiptPDF({
      payment,
      invoice,
      client,
    });

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
