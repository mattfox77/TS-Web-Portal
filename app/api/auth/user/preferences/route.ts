import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { NotificationPreferences } from '@/types';
import { UnauthorizedError, ValidationError, handleError } from '@/lib/errors';
import { execute } from '@/lib/db-utils';

export const runtime = 'edge';

// PATCH /api/auth/user/preferences - Update user notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const { tickets, invoices, payments, subscriptions } = body;

    // Validate preferences
    if (
      typeof tickets !== 'boolean' ||
      typeof invoices !== 'boolean' ||
      typeof payments !== 'boolean' ||
      typeof subscriptions !== 'boolean'
    ) {
      throw new ValidationError({
        preferences: 'All notification preferences must be boolean values',
      });
    }

    const preferences: NotificationPreferences = {
      tickets,
      invoices,
      payments,
      subscriptions,
    };

    // Update user preferences in database
    await execute(
      `UPDATE users 
       SET notification_preferences = $1 
       WHERE id = $2`,
      [JSON.stringify(preferences), userId]
    );

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    return handleError(error);
  }
}
