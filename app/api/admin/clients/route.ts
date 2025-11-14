import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { Client } from '@/types';
import { sql } from "@vercel/postgres";

// GET /api/admin/clients - Get all clients (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    // Fetch all clients with summary stats
    const { results: clients } = await db
      .prepare(`
        SELECT 
          c.*,
          COUNT(DISTINCT t.id) as open_tickets,
          COUNT(DISTINCT i.id) as unpaid_invoices,
          COALESCE(SUM(CASE WHEN i.status != 'paid' THEN i.total ELSE 0 END), 0) as outstanding_amount
        FROM clients c
        LEFT JOIN tickets t ON c.id = t.client_id AND t.status IN ('open', 'in_progress')
        LEFT JOIN invoices i ON c.id = i.client_id AND i.status IN ('sent', 'overdue')
        WHERE c.status = 'active'
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `)
      .all<Client & { open_tickets: number; unpaid_invoices: number; outstanding_amount: number }>();

    return NextResponse.json({ clients });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/clients - Create new client (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const body = await request.json();
    const { name, email, company_name, phone, address } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .prepare('SELECT id FROM clients WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    // Create client
    const clientId = crypto.randomUUID();
    await db
      .prepare(`
        INSERT INTO clients 
        (id, name, email, company_name, phone, address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        clientId,
        name,
        email,
        company_name || null,
        phone || null,
        address || null,
        'active'
      )
      .run();

    // Fetch the created client
    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(clientId)
      .first<Client>();

    return NextResponse.json(
      { client, message: 'Client created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
