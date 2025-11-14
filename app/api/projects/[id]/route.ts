import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { getUserClientId } from '@/lib/auth';
import { queryOne, queryAll } from '@/lib/db-utils';
import { Project, Ticket, Document } from '@/types';

export const runtime = 'edge';

// GET /api/projects/[id] - Get project details with tickets and documents
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
    const projectId = params.id;

    // Get project details
    const project = await queryOne<Project>(
      `SELECT * FROM projects WHERE id = $1 AND client_id = $2`,
      [projectId, clientId]
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get associated tickets
    const tickets = await queryAll<Ticket>(
      `SELECT 
        t.*,
        u.first_name,
        u.last_name,
        u.email
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC`,
      [projectId]
    );

    // Get associated documents
    const documents = await queryAll<Document>(
      `SELECT 
        d.*,
        u.first_name,
        u.last_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.project_id = $1
      ORDER BY d.uploaded_at DESC`,
      [projectId]
    );

    return NextResponse.json({
      project,
      tickets: tickets || [],
      documents: documents || [],
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project details' },
      { status: 500 }
    );
  }
}
