import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { queryOne, queryAll, execute } from '@/lib/db-utils';
import { TicketComment } from '@/types';

export const runtime = 'edge';

// GET /api/tickets/[id]/comments - Get ticket comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = await getUserClientId(userId);

    // Verify ticket belongs to user's client
    const ticket = await queryOne(
      'SELECT id FROM tickets WHERE id = $1 AND client_id = $2',
      [params.id, clientId]
    );

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get comments with user information
    const results = await queryAll<TicketComment & { first_name?: string; last_name?: string; email: string; role: string }>(
      `SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1 AND c.is_internal = 0
      ORDER BY c.created_at ASC`,
      [params.id]
    );

    // Format comments with user data
    const comments = results.map((comment: any) => ({
      id: comment.id,
      ticket_id: comment.ticket_id,
      user_id: comment.user_id,
      content: comment.content,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        email: comment.email,
        first_name: comment.first_name,
        last_name: comment.last_name,
        role: comment.role,
      },
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = await getUserClientId(userId);

    // Verify ticket belongs to user's client
    const ticket = await queryOne(
      'SELECT id FROM tickets WHERE id = $1 AND client_id = $2',
      [params.id, clientId]
    );

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (body.content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment must be less than 5000 characters' },
        { status: 400 }
      );
    }

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO ticket_comments (
        id, ticket_id, user_id, content, is_internal, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [commentId, params.id, userId, body.content.trim(), 0, now]
    );

    // Update ticket's updated_at timestamp
    await execute(
      'UPDATE tickets SET updated_at = $1 WHERE id = $2',
      [now, params.id]
    );

    // Get the created comment with user info
    const comment = await queryOne<TicketComment & { first_name?: string; last_name?: string; email: string; role: string }>(
      `SELECT 
        c.*,
        u.first_name,
        u.last_name,
        u.email,
        u.role
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [commentId]
    );

    if (!comment) {
      throw new Error('Failed to retrieve created comment');
    }

    const formattedComment = {
      id: comment.id,
      ticket_id: comment.ticket_id,
      user_id: comment.user_id,
      content: comment.content,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        email: comment.email,
        first_name: comment.first_name,
        last_name: comment.last_name,
        role: comment.role,
      },
    };

    return NextResponse.json({ comment: formattedComment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
