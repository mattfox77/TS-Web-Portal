import { NextRequest, NextResponse } from "next/server";

import { requireAuth, getUserClientId } from "@/lib/auth";
import { handleError } from "@/lib/errors";
import { setCacheHeaders, CachePresets } from "@/lib/cache";
import { sql } from "@vercel/postgres";

export const runtime = "edge";

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for the authenticated user's client
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const clientId = await getUserClientId(userId);
    
    const openTicketsResult = await sql`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE client_id = ${clientId} AND status IN ('open', 'in_progress', 'waiting_client')
    `;
    
    const activeProjectsResult = await sql`
      SELECT COUNT(*) as count
      FROM projects
      WHERE client_id = ${clientId} AND status IN ('planning', 'active')
    `;
    
    const unpaidInvoicesResult = await sql`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_amount
      FROM invoices
      WHERE client_id = ${clientId} AND status IN ('sent', 'overdue')
    `;
    
    const response = NextResponse.json({
      openTickets: Number(openTicketsResult.rows[0]?.count) || 0,
      activeProjects: Number(activeProjectsResult.rows[0]?.count) || 0,
      unpaidInvoices: Number(unpaidInvoicesResult.rows[0]?.count) || 0,
      unpaidAmount: Number(unpaidInvoicesResult.rows[0]?.total_amount) || 0,
    });
    
    return setCacheHeaders(response, CachePresets.SHORT);
  } catch (error) {
    return handleError(error);
  }
}
