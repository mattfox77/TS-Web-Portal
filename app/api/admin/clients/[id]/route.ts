import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { Client } from '@/types';
import { sql } from "@vercel/postgres";

// GET /api/admin/clients/[id] - Get client by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const clientId = params.id;

    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(clientId)
      .first<Client>();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/clients/[id] - Update client (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const clientId = params.id;

    const body = await request.json();
    const { name, email, company_name, phone, address, status } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if client exists
    const existing = await db
      .prepare('SELECT id FROM clients WHERE id = ?')
      .bind(clientId)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if email is already used by another client
    const emailCheck = await db
      .prepare('SELECT id FROM clients WHERE email = ? AND id != ?')
      .bind(email, clientId)
      .first();

    if (emailCheck) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }

    // Update client
    await db
      .prepare(`
        UPDATE clients 
        SET name = ?, email = ?, company_name = ?, phone = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        name,
        email,
        company_name || null,
        phone || null,
        address || null,
        status || 'active',
        clientId
      )
      .run();

    // Fetch the updated client
    const client = await db
      .prepare('SELECT * FROM clients WHERE id = ?')
      .bind(clientId)
      .first<Client>();

    return NextResponse.json({
      client,
      message: 'Client updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/clients/[id] - Delete client (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const clientId = params.id;

    // Check if client exists
    const existing = await db
      .prepare('SELECT id FROM clients WHERE id = ?')
      .bind(clientId)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Delete client (cascade will handle related records)
    await db
      .prepare('DELETE FROM clients WHERE id = ?')
      .bind(clientId)
      .run();

    return NextResponse.json({
      message: 'Client deleted successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}
