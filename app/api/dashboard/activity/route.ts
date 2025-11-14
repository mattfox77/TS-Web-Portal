import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getUserClientId } from "@/lib/auth";
import { handleError } from "@/lib/errors";
import { queryAll } from "@/lib/db-utils";
import type { ActivityLogEntry } from "@/types";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth();
    const clientId = await getUserClientId(userId);
    
    const results = await queryAll<{
      id: string;
      user_id: string | null;
      client_id: string | null;
      action: string;
      entity_type: string | null;
      entity_id: string | null;
      details: string | null;
      ip_address: string | null;
      created_at: string;
    }>(
      `SELECT id, user_id, client_id, action, entity_type, entity_id, details, ip_address, created_at
       FROM activity_log WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [clientId]
    );
    
    const activities: ActivityLogEntry[] = results.map((row) => ({
      id: row.id,
      user_id: row.user_id || undefined,
      client_id: row.client_id || undefined,
      action: row.action,
      entity_type: row.entity_type || undefined,
      entity_id: row.entity_id || undefined,
      details: row.details ? JSON.parse(row.details) : undefined,
      ip_address: row.ip_address || undefined,
      created_at: row.created_at,
    }));
    
    return NextResponse.json({ activities });
  } catch (error) {
    return handleError(error);
  }
}
