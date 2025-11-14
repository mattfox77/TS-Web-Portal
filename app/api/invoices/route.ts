import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId, requireAdmin } from '@/lib/auth';
import { handleError, NotFoundError } from '@/lib/errors';
import { Invoice } from '@/types';
import { createInvoiceSchema } from '@/lib/validation';
import { paginateQuery, parsePaginationParams } from '@/lib/pagination';
import { sql } from "@vercel/postgres";

// GET /api/invoices - Get invoices for authenticated user's client
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Migrated to Vercel Postgres
    // Get client ID for the user
    const clientId = await getUserClientId(userId);

    // Get query parameters for filtering and pagination
    const url = new URL(request.url);
    const { page, perPage } = parsePaginationParams(url);
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    // Build query with filters
    let baseQuery = `
      SELECT * FROM invoices 
      WHERE client_id = ?
    `;
    
    let countQuery = `
      SELECT COUNT(*) as count FROM invoices 
      WHERE client_id = ?
    `;
    
    const params: any[] = [clientId];

    if (status) {
      baseQuery += ' AND status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
    }

    if (dateFrom) {
      baseQuery += ' AND issue_date >= ?';
      countQuery += ' AND issue_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      baseQuery += ' AND issue_date <= ?';
      countQuery += ' AND issue_date <= ?';
      params.push(dateTo);
    }

    baseQuery += ' ORDER BY created_at DESC';

    // Use pagination helper
    const result = await paginateQuery<Invoice>(
      db,
      baseQuery,
      countQuery,
      params,
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/invoices - Create new invoice (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const body = await request.json();
    const validated = createInvoiceSchema.parse(body);

    // Verify client exists
    const client = await db
      .prepare('SELECT id FROM clients WHERE id = ?')
      .bind(validated.client_id)
      .first();

    if (!client) {
      throw new NotFoundError('Client');
    }

    // Calculate totals
    const subtotal = validated.line_items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxRate = 0.08; // 8% tax rate - could be configurable
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Generate invoice number (INV-YYYY-NNNN)
    const year = new Date().getFullYear();
    const countResult = await db
      .prepare(`SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?`)
      .bind(`INV-${year}-%`)
      .first<{ count: number }>();
    
    const nextNumber = (countResult?.count || 0) + 1;
    const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create invoice
    const invoiceId = crypto.randomUUID();
    const issueDate = new Date().toISOString();
    const dueDate = validated.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db
      .prepare(`
        INSERT INTO invoices 
        (id, invoice_number, client_id, status, subtotal, tax_rate, tax_amount, total, currency, issue_date, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        invoiceId,
        invoiceNumber,
        validated.client_id,
        'draft',
        subtotal,
        taxRate,
        taxAmount,
        total,
        'USD',
        issueDate,
        dueDate,
        validated.notes || null
      )
      .run();

    // Create invoice items
    for (const item of validated.line_items) {
      const itemId = crypto.randomUUID();
      const amount = item.quantity * item.unit_price;

      await db
        .prepare(`
          INSERT INTO invoice_items 
          (id, invoice_id, description, quantity, unit_price, amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          itemId,
          invoiceId,
          item.description,
          item.quantity,
          item.unit_price,
          amount
        )
        .run();
    }

    // Fetch the created invoice with items
    const invoice = await db
      .prepare('SELECT * FROM invoices WHERE id = ?')
      .bind(invoiceId)
      .first<Invoice>();

    const { results: items } = await db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ?')
      .bind(invoiceId)
      .all();

    return NextResponse.json(
      { 
        invoice: { ...invoice, items },
        message: 'Invoice created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
