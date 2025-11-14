import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { sql } from "@vercel/postgres";
import { UnauthorizedError, ForbiddenError, NotFoundError } from "./errors";
import type { NextRequest } from "next/server";

/**
 * Requires authentication and returns the authenticated user ID
 * Checks for impersonation and returns impersonated user ID if active
 * Throws UnauthorizedError if user is not authenticated
 */
export async function requireAuth(request?: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }

  // Check for impersonation
  if (request) {
    const impersonatingUserId = request.cookies.get('impersonating_user_id')?.value;
    const impersonatingAdminId = request.cookies.get('impersonating_admin_id')?.value;
    
    if (impersonatingUserId && impersonatingAdminId) {
      // Verify the admin is still authenticated
      if (userId === impersonatingAdminId) {
        return impersonatingUserId;
      }
    }
  }

  return userId;
}

/**
 * Gets the current user ID, checking for impersonation
 * Returns null if not authenticated
 */
export async function getCurrentUserId(request?: NextRequest): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  // Check for impersonation
  if (request) {
    const impersonatingUserId = request.cookies.get('impersonating_user_id')?.value;
    const impersonatingAdminId = request.cookies.get('impersonating_admin_id')?.value;
    
    if (impersonatingUserId && impersonatingAdminId && userId === impersonatingAdminId) {
      return impersonatingUserId;
    }
  }

  return userId;
}

/**
 * Checks if currently impersonating a user
 * Returns impersonation info or null
 */
export async function getImpersonationInfo(request?: NextRequest): Promise<{
  isImpersonating: boolean;
  impersonatedUserId?: string;
  adminUserId?: string;
} | null> {
  if (!request) {
    return null;
  }

  const impersonatingUserId = request.cookies.get('impersonating_user_id')?.value;
  const impersonatingAdminId = request.cookies.get('impersonating_admin_id')?.value;

  if (impersonatingUserId && impersonatingAdminId) {
    const { userId } = await auth();
    if (userId === impersonatingAdminId) {
      return {
        isImpersonating: true,
        impersonatedUserId: impersonatingUserId,
        adminUserId: impersonatingAdminId,
      };
    }
  }

  return { isImpersonating: false };
}

/**
 * Requires admin role and returns the authenticated admin user ID
 * Does NOT check impersonation - always returns the real admin user ID
 * Throws UnauthorizedError if not authenticated
 * Throws ForbiddenError if user is not an admin
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }

  const result = await sql`
    SELECT role FROM users WHERE id = ${userId}
  `;
  
  const user = result.rows[0];
  
  if (!user) {
    throw new NotFoundError("User");
  }
  
  if (user.role !== "admin") {
    throw new ForbiddenError("Admin access required");
  }
  
  return userId;
}

/**
 * Gets the client ID associated with the authenticated user
 * Throws UnauthorizedError if not authenticated
 * Throws NotFoundError if user record doesn't exist
 */
export async function getUserClientId(userId: string): Promise<string> {
  const result = await sql`
    SELECT client_id FROM users WHERE id = ${userId}
  `;
  
  const user = result.rows[0];
  
  if (!user) {
    throw new NotFoundError("User");
  }
  
  return user.client_id;
}

/**
 * Checks if the authenticated user has access to a specific client's data
 * Returns true if user is admin or belongs to the client
 */
export async function hasClientAccess(
  userId: string,
  clientId: string
): Promise<boolean> {
  const result = await sql`
    SELECT role, client_id FROM users WHERE id = ${userId}
  `;
  
  const user = result.rows[0];
  
  if (!user) {
    return false;
  }
  
  // Admins have access to all clients
  if (user.role === "admin") {
    return true;
  }
  
  // Regular users only have access to their own client
  return user.client_id === clientId;
}
