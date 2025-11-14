// app/api/admin/projects/[id]/budget/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { sql } from "@vercel/postgres";

const budgetSchema = z.object({
  budget_threshold_usd: z.number().positive().nullable(),
  budget_alert_threshold_percent: z.number().int().min(1).max(100).optional(),
});

/**
 * PATCH /api/admin/projects/[id]/budget
 * Update budget threshold settings for a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const projectId = params.id;

    // Verify project exists
    const project = await db
      .prepare('SELECT id FROM projects WHERE id = ?')
      .bind(projectId)
      .first();

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = budgetSchema.parse(body);

    // Update project budget settings
    await db
      .prepare(`
        UPDATE projects 
        SET 
          budget_threshold_usd = ?,
          budget_alert_threshold_percent = COALESCE(?, budget_alert_threshold_percent),
          updated_at = ?
        WHERE id = ?
      `)
      .bind(
        validated.budget_threshold_usd,
        validated.budget_alert_threshold_percent || null,
        new Date().toISOString(),
        projectId
      )
      .run();

    // Fetch updated project
    const updatedProject = await db
      .prepare(`
        SELECT 
          id,
          name,
          budget_threshold_usd,
          budget_alert_threshold_percent,
          last_budget_alert_sent
        FROM projects 
        WHERE id = ?
      `)
      .bind(projectId)
      .first();

    return NextResponse.json({
      message: 'Budget settings updated',
      project: updatedProject,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 422 }
      );
    }
    return handleError(error);
  }
}

/**
 * GET /api/admin/projects/[id]/budget
 * Get budget settings and current usage for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    const projectId = params.id;

    // Get project budget settings and current usage
    const result = await db
      .prepare(`
        SELECT 
          p.id,
          p.name,
          p.budget_threshold_usd,
          p.budget_alert_threshold_percent,
          p.last_budget_alert_sent,
          COALESCE(SUM(u.cost_usd), 0) as current_usage_usd,
          COUNT(u.id) as request_count
        FROM projects p
        LEFT JOIN api_usage u ON u.project_id = p.id
        WHERE p.id = ?
        GROUP BY p.id, p.name, p.budget_threshold_usd, 
                 p.budget_alert_threshold_percent, p.last_budget_alert_sent
      `)
      .bind(projectId)
      .first<any>();

    if (!result) {
      throw new NotFoundError('Project');
    }

    const usagePercentage = result.budget_threshold_usd
      ? (result.current_usage_usd / result.budget_threshold_usd) * 100
      : 0;

    return NextResponse.json({
      project: {
        id: result.id,
        name: result.name,
        budget_threshold_usd: result.budget_threshold_usd,
        budget_alert_threshold_percent: result.budget_alert_threshold_percent || 80,
        last_budget_alert_sent: result.last_budget_alert_sent,
        current_usage_usd: result.current_usage_usd,
        usage_percentage: usagePercentage,
        request_count: result.request_count,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
