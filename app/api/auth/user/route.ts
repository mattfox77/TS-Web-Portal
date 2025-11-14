import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/errors";
import { getUserWithClient } from "@/lib/db-utils";
import type { User, Client } from "@/types";

export const runtime = "edge";

/**
 * GET /api/auth/user
 * Returns the authenticated user's information and associated client data
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const userId = await requireAuth();
    
    // Get user data with client information
    const result = await getUserWithClient(userId);
    
    if (!result) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Structure the response
    const user: User = {
      id: result.id,
      client_id: result.client_id,
      email: result.email,
      first_name: result.first_name || undefined,
      last_name: result.last_name || undefined,
      role: result.role as "user" | "admin",
      notification_preferences: result.notification_preferences 
        ? JSON.parse(result.notification_preferences)
        : { tickets: true, invoices: true, payments: true, subscriptions: true },
      created_at: result.created_at,
    };
    
    const client: Client = {
      id: result.client_id,
      name: result.client_name,
      email: result.client_email,
      company_name: result.company_name || undefined,
      phone: result.phone || undefined,
      address: result.address || undefined,
      status: result.client_status as "active" | "inactive" | "suspended",
      created_at: result.client_created_at,
      updated_at: result.client_created_at, // Using created_at as fallback
    };
    
    return NextResponse.json({
      user,
      client,
    });
  } catch (error) {
    return handleError(error);
  }
}
