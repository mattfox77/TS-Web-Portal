// app/api/admin/usage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { sql } from "@vercel/postgres";
import {
  aggregateUsageByProvider,
  aggregateUsageByModel,
  aggregateDailyUsage,
} from '@/lib/pricing';

/**
 * GET /api/admin/usage
 * Retrieve aggregated usage data for admin analytics
 * 
 * Query parameters:
 * - client_id: Filter by specific client (optional)
 * - project_id: Filter by specific project (optional)
 * - date_from: Start date for filtering (ISO 8601 format, optional)
 * - date_to: End date for filtering (ISO 8601 format, optional)
 * - view: Aggregation view - 'daily', 'provider', 'model', or 'raw' (default: 'daily')
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const projectId = searchParams.get('project_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const view = searchParams.get('view') || 'daily';

    // Build base query
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
        p.name as project_name,
        p.client_id,
        c.name as client_name
      FROM api_usage u
      JOIN projects p ON p.id = u.project_id
      JOIN clients c ON c.id = p.client_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (clientId) {
      query += ' AND p.client_id = ?';
      params.push(clientId);
    }

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

    query += ' ORDER BY u.request_timestamp DESC';

    const { results } = await db.prepare(query).bind(...params).all();

    // Calculate summary statistics
    const totalCost = results.reduce((sum: number, r: any) => sum + r.cost_usd, 0);
    const totalTokens = results.reduce((sum: number, r: any) => sum + r.total_tokens, 0);
    const requestCount = results.length;

    // Aggregate data based on view type
    let aggregatedData;
    switch (view) {
      case 'provider':
        aggregatedData = aggregateUsageByProvider(results as any);
        break;
      case 'model':
        aggregatedData = aggregateUsageByModel(results as any);
        break;
      case 'daily':
        aggregatedData = aggregateDailyUsage(results as any);
        break;
      case 'raw':
        aggregatedData = results;
        break;
      default:
        aggregatedData = aggregateDailyUsage(results as any);
    }

    // Get project summaries
    const projectSummaryQuery = `
      SELECT 
        p.id,
        p.name,
        p.client_id,
        c.name as client_name,
        COUNT(u.id) as request_count,
        SUM(u.total_tokens) as total_tokens,
        SUM(u.cost_usd) as total_cost
      FROM projects p
      JOIN clients c ON c.id = p.client_id
      LEFT JOIN api_usage u ON u.project_id = p.id
      ${dateFrom ? 'AND u.request_timestamp >= ?' : ''}
      ${dateTo ? 'AND u.request_timestamp <= ?' : ''}
      ${clientId ? 'WHERE p.client_id = ?' : ''}
      ${projectId ? (clientId ? 'AND' : 'WHERE') + ' p.id = ?' : ''}
      GROUP BY p.id, p.name, p.client_id, c.name
      HAVING request_count > 0
      ORDER BY total_cost DESC
    `;

    const projectParams: any[] = [];
    if (dateFrom) projectParams.push(dateFrom);
    if (dateTo) projectParams.push(dateTo);
    if (clientId) projectParams.push(clientId);
    if (projectId) projectParams.push(projectId);

    const { results: projectSummaries } = await db
      .prepare(projectSummaryQuery)
      .bind(...projectParams)
      .all();

    return NextResponse.json({
      summary: {
        total_cost: totalCost,
        total_tokens: totalTokens,
        request_count: requestCount,
      },
      data: aggregatedData,
      projects: projectSummaries,
      filters: {
        client_id: clientId,
        project_id: projectId,
        date_from: dateFrom,
        date_to: dateTo,
        view,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
