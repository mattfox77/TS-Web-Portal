import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { Project } from '@/types';
import { sql } from "@vercel/postgres";

// GET /api/admin/projects/[id] - Get project by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const projectId = params.id;

    const project = await db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(projectId)
      .first<Project>();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/projects/[id] - Update project (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const projectId = params.id;

    const body = await request.json();
    const {
      client_id,
      name,
      description,
      status,
      github_repo,
      start_date,
      estimated_completion,
      actual_completion,
    } = body;

    // Validate required fields
    if (!client_id || !name) {
      return NextResponse.json(
        { error: 'Client ID and project name are required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existing = await db
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
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

    // Update project
    await db
      .prepare(`
        UPDATE projects 
        SET client_id = ?, name = ?, description = ?, status = ?, 
            github_repo = ?, start_date = ?, estimated_completion = ?, 
            actual_completion = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        client_id,
        name,
        description || null,
        status || 'planning',
        github_repo || null,
        start_date || null,
        estimated_completion || null,
        actual_completion || null,
        projectId
      )
      .run();

    // Fetch the updated project
    const project = await db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .bind(projectId)
      .first<Project>();

    return NextResponse.json({
      project,
      message: 'Project updated successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/projects/[id] - Delete project (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const projectId = params.id;

    // Check if project exists
    const existing = await db
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project (cascade will handle related records)
    await db
      .prepare('DELETE FROM projects WHERE id = ?')
      .bind(projectId)
      .run();

    return NextResponse.json({
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return handleError(error);
  }
}
