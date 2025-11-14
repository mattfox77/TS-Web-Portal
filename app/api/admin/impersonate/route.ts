import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { auth } from '@clerk/nextjs/server';
import { sql } from "@vercel/postgres";

// POST /api/admin/impersonate - Start impersonating a user (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUserId = await requireAdmin(request);

    // Migrated to Vercel Postgres
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the target user exists
    const targetUser = await db
      .prepare('SELECT id, client_id, email, first_name, last_name FROM users WHERE id = ?')
      .bind(user_id)
      .first<{
        id: string;
        client_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>();

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get admin user info for logging
    const adminUser = await db
      .prepare('SELECT email, first_name, last_name FROM users WHERE id = ?')
      .bind(adminUserId)
      .first<{
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>();

    // Log the impersonation action
    const logId = crypto.randomUUID();
    await db
      .prepare(`
        INSERT INTO activity_log 
        (id, user_id, client_id, action, entity_type, entity_id, details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        logId,
        adminUserId,
        targetUser.client_id,
        'admin_impersonation_started',
        'user',
        user_id,
        JSON.stringify({
          admin_email: adminUser?.email,
          target_email: targetUser.email,
          target_name: `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim(),
        })
      )
      .run();

    // Create response with impersonation cookie
    const response = NextResponse.json({
      message: 'Impersonation started',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim(),
      },
    });

    // Set impersonation cookie (expires in 1 hour)
    response.cookies.set('impersonating_user_id', user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    response.cookies.set('impersonating_admin_id', adminUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/impersonate - Stop impersonating (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Migrated to Vercel Postgres
    // Get impersonation info from cookies
    const impersonatingUserId = request.cookies.get('impersonating_user_id')?.value;
    const impersonatingAdminId = request.cookies.get('impersonating_admin_id')?.value;

    if (impersonatingUserId && impersonatingAdminId) {
      // Log the end of impersonation
      const logId = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO activity_log 
          (id, user_id, action, entity_type, entity_id)
          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          logId,
          impersonatingAdminId,
          'admin_impersonation_ended',
          'user',
          impersonatingUserId
        )
        .run();
    }

    // Create response and clear impersonation cookies
    const response = NextResponse.json({
      message: 'Impersonation ended',
    });

    response.cookies.delete('impersonating_user_id');
    response.cookies.delete('impersonating_admin_id');

    return response;
  } catch (error) {
    return handleError(error);
  }
}
