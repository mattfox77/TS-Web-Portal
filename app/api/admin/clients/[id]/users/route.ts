import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { sql } from "@vercel/postgres";

// GET /api/admin/clients/[id]/users - Get users for a client (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const clientId = params.id;

    // Verify client exists
    const client = await db
      .prepare('SELECT id FROM clients WHERE id = ?')
      .bind(clientId)
      .first();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch users for this client
    const { results: users } = await db
      .prepare(`
        SELECT id, email, first_name, last_name, role, created_at
        FROM users
        WHERE client_id = ?
        ORDER BY created_at ASC
      `)
      .bind(clientId)
      .all<{
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        role: string;
        created_at: string;
      }>();

    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
}
