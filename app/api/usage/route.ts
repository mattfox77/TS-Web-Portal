// app/api/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { z } from 'zod';
import { calculateTokenCost, calculateTotalTokens } from '@/lib/pricing';
import { UnauthorizedError, ValidationError, handleError } from '@/lib/errors';
import { sql } from "@vercel/postgres";

// Validation schema for usage tracking
const usageSchema = z.object({
  project_id: z.string().uuid(),
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  input_tokens: z.number().int().min(0),
  output_tokens: z.number().int().min(0),
  request_timestamp: z.string().datetime().optional(),
});

/**
 * POST /api/usage
 * Record API usage for a project
 * 
 * This endpoint allows external applications to track their API usage
 * for cost monitoring and billing purposes.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = usageSchema.parse(body);

    // Migrated to Vercel Postgres
    // Verify user has access to the project
    const project = await db
      .prepare(`
        SELECT p.id, p.client_id
        FROM projects p
        JOIN users u ON u.client_id = p.client_id
        WHERE p.id = ? AND u.id = ?
      `)
      .bind(validated.project_id, userId)
      .first<{ id: string; client_id: string }>();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate cost and total tokens
    const totalTokens = calculateTotalTokens(
      validated.input_tokens,
      validated.output_tokens
    );
    const cost = calculateTokenCost(
      validated.provider,
      validated.model,
      validated.input_tokens,
      validated.output_tokens
    );

    // Insert usage record
    const usageId = crypto.randomUUID();
    const timestamp = validated.request_timestamp || new Date().toISOString();

    await db
      .prepare(`
        INSERT INTO api_usage (
          id,
          project_id,
          provider,
          model,
          input_tokens,
          output_tokens,
          total_tokens,
          cost_usd,
          request_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        usageId,
        validated.project_id,
        validated.provider,
        validated.model,
        validated.input_tokens,
        validated.output_tokens,
        totalTokens,
        cost,
        timestamp
      )
      .run();

    return NextResponse.json(
      {
        id: usageId,
        project_id: validated.project_id,
        provider: validated.provider,
        model: validated.model,
        input_tokens: validated.input_tokens,
        output_tokens: validated.output_tokens,
        total_tokens: totalTokens,
        cost_usd: cost,
        request_timestamp: timestamp,
      },
      { status: 201 }
    );
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
 * GET /api/usage
 * Retrieve usage data for the authenticated user's projects
 * 
 * Query parameters:
 * - project_id: Filter by specific project (optional)
 * - date_from: Start date for filtering (ISO 8601 format, optional)
 * - date_to: End date for filtering (ISO 8601 format, optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { userId } = auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Migrated to Vercel Postgres
    // Get user's client_id
    const user = await db
      .prepare('SELECT client_id FROM users WHERE id = ?')
      .bind(userId)
      .first<{ client_id: string }>();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build query
    let query = `
      SELECT 
        u.id,
        u.project_id,
        u.provider,
        u.model,
        u.input_tokens,
        u.output_tokens,
        u.total_tokens,
        u.cost_usd,
        u.request_timestamp,
        p.name as project_name
      FROM api_usage u
      JOIN projects p ON p.id = u.project_id
      WHERE p.client_id = ?
    `;
    const params: any[] = [user.client_id];

    if (projectId) {
      query += ' AND u.project_id = ?';
      params.push(projectId);
    }

    if (dateFrom) {
      query += ' AND u.request_timestamp >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND u.request_timestamp <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY u.request_timestamp DESC LIMIT 1000';

    const { results } = await db.prepare(query).bind(...params).all();

    return NextResponse.json({
      usage: results,
      count: results.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
