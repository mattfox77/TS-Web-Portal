import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { paginateQuery } from '@/lib/pagination';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '50'), 100);
    
    const action = searchParams.get('action');
    const entityType = searchParams.get('entity_type');
    const userId = searchParams.get('user_id');
    const clientId = searchParams.get('client_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (action) {
      conditions.push(`al.action LIKE $${paramIndex++}`);
      params.push(`%${action}%`);
    }
    if (entityType) {
      conditions.push(`al.entity_type = $${paramIndex++}`);
      params.push(entityType);
    }
    if (userId) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(userId);
    }
    if (clientId) {
      conditions.push(`al.client_id = $${paramIndex++}`);
      params.push(clientId);
    }
    if (dateFrom) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(dateTo);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const baseQuery = `
      SELECT al.*, u.email as user_email, c.name as client_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN clients c ON al.client_id = c.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `;
    
    const countQuery = `SELECT COUNT(*) as count FROM activity_log al ${whereClause}`;
    
    const result = await paginateQuery(baseQuery, countQuery, params, page, perPage);
    
    const parsedLogs = result.data.map((log: any) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
    
    return NextResponse.json({ data: parsedLogs, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}
