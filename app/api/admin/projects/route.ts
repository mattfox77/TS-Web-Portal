import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { Project } from '@/types';
import { sql } from "@vercel/postgres";

// POST /api/admin/projects - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const body = await request.json();
    const {
      client_id,
      name,
      description,
      status,
      github_repo,
      start_date,
      estimated_completion,
    } = body;

    // Validate required fields
    if (!client_id || !name) {
      return NextResponse.json(
        { error: 'Client ID and project name are required' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await db
      .prepare('SELECT id FROM clients WHERE id = ?')
      .bind(client_id)
      .first();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create project
    const projectId = crypto.randomUUID();
    await db
      .prepare(`
        INSERT INTO projects 
        (id, client_id, name, description, status, github_repo, start_date, estimated_completion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        projectId,
        client_id,
        name,
        description || null,
        status || 'planning',
        github_repo || null,
        start_date || null,
        estimated_completion || null
      )
      .run();

    // Fetch the created project
    const project = await db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(projectId)
      .first<Project>();

    return NextResponse.json(
      { project, message: 'Project created successfully' },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
