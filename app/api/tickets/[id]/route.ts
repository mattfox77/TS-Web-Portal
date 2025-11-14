import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserClientId } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db-utils';
import { Ticket } from '@/types';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = await getUserClientId(userId);
    const ticket = await queryOne<Ticket>(
      `SELECT t.*, p.name as project_name FROM tickets t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND t.client_id = $2`,
      [params.id, clientId]
    );

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = await getUserClientId(userId);
    const ticket = await queryOne('SELECT id FROM tickets WHERE id = $1 AND client_id = $2', [params.id, clientId]);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(body.status);
    }
    if (body.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(body.priority);
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });

    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date().toISOString());

    if (body.status === 'resolved' || body.status === 'closed') {
      updates.push(`resolved_at = $${paramIndex++}`);
      values.push(new Date().toISOString());
    }

    values.push(params.id);
    await execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    const updatedTicket = await queryOne<Ticket>(
      `SELECT t.*, p.name as project_name FROM tickets t
       LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = $1`,
      [params.id]
    );

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
