import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { Payment } from '@/types';
import { sql } from "@vercel/postgres";

// GET /api/payments - Get payment history for authenticated user's client
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Migrated to Vercel Postgres
    // Get client ID for the user
    const clientId = await getUserClientId(userId);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query with filters and join with invoices for additional context
    let query = `
      SELECT 
        p.*,
        i.invoice_number,
        i.status as invoice_status,
        s.service_package_id
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      WHERE p.client_id = ?
    `;
    const params: any[] = [clientId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      query += ' AND p.created_at >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND p.created_at <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY p.created_at DESC';

    const { results } = await db.prepare(query).bind(...params).all<Payment & { 
      invoice_number?: string;
      invoice_status?: string;
      service_package_id?: string;
    }>();

    // Calculate year-to-date total
    const currentYear = new Date().getFullYear();
    const ytdQuery = `
      SELECT SUM(amount) as ytd_total
      FROM payments
      WHERE client_id = ?
        AND status = 'completed'
        AND strftime('%Y', created_at) = ?
    `;
    
    const ytdResult = await db
      .prepare(ytdQuery)
      .bind(clientId, currentYear.toString())
      .first<{ ytd_total: number | null }>();

    const ytdTotal = ytdResult?.ytd_total || 0;

    return NextResponse.json({ 
      payments: results,
      ytd_total: ytdTotal,
      year: currentYear
    });
  } catch (error) {
    return handleError(error);
  }
}
