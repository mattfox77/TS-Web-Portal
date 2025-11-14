import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { sql } from "@vercel/postgres";

// GET /api/admin/stats - Get aggregate admin statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    // Get total clients
    const totalClientsResult = await db
      .prepare('SELECT COUNT(*) as count FROM clients WHERE status = ?')
      .bind('active')
      .first<{ count: number }>();
    const totalClients = totalClientsResult?.count || 0;

    // Get open tickets count
    const openTicketsResult = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM tickets 
        WHERE status IN ('open', 'in_progress', 'waiting_client')
      `)
      .first<{ count: number }>();
    const openTickets = openTicketsResult?.count || 0;

    // Get monthly revenue (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenueResult = await db
      .prepare(`
        SELECT COALESCE(SUM(total), 0) as revenue
        FROM invoices
        WHERE status = 'paid' 
        AND paid_date >= ?
      `)
      .bind(firstDayOfMonth)
      .first<{ revenue: number }>();
    const monthlyRevenue = monthlyRevenueResult?.revenue || 0;

    // Get outstanding invoices
    const outstandingResult = await db
      .prepare(`
        SELECT 
          COUNT(*) as count,
          COALESCE(SUM(total), 0) as amount
        FROM invoices
        WHERE status IN ('sent', 'overdue')
      `)
      .first<{ count: number; amount: number }>();
    const outstandingInvoices = outstandingResult?.count || 0;
    const outstandingAmount = outstandingResult?.amount || 0;

    // Get active projects count
    const activeProjectsResult = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM projects 
        WHERE status IN ('planning', 'active')
      `)
      .first<{ count: number }>();
    const activeProjects = activeProjectsResult?.count || 0;

    // Get active subscriptions count
    const activeSubscriptionsResult = await db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM subscriptions 
        WHERE status = 'active'
      `)
      .first<{ count: number }>();
    const activeSubscriptions = activeSubscriptionsResult?.count || 0;

    // Get recent activity (last 10 items)
    const { results: recentActivity } = await db
      .prepare(`
        SELECT 
          al.id,
          al.action,
          al.entity_type,
          al.entity_id,
          al.created_at,
          u.first_name,
          u.last_name,
          u.email,
          c.name as client_name
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN clients c ON al.client_id = c.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `)
      .all<{
        id: string;
        action: string;
        entity_type: string | null;
        entity_id: string | null;
        created_at: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        client_name: string | null;
      }>();

    return NextResponse.json({
      stats: {
        totalClients,
        openTickets,
        monthlyRevenue,
        outstandingInvoices,
        outstandingAmount,
        activeProjects,
        activeSubscriptions,
      },
      recentActivity,
    });
  } catch (error) {
    return handleError(error);
  }
}
