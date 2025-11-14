import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getUserClientId } from "@/lib/auth";
import { cancelPayPalSubscription, getPayPalSubscription } from "@/lib/paypal-subscriptions";
import { Subscription } from "@/types";
import { sql } from "@vercel/postgres";

/**
 * GET /api/payments/subscriptions/[id]
 * Get subscription details
 */
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Migrated to Vercel Postgres
    // Get client ID for the authenticated user
    const clientId = await getUserClientId(userId);

    // Get subscription
    const subscription = await db
      .prepare(`
        SELECT 
          s.*,
          sp.name as package_name,
          sp.description as package_description,
          sp.price_monthly,
          sp.price_annual,
          sp.features
        FROM subscriptions s
        JOIN service_packages sp ON s.service_package_id = sp.id
        WHERE s.id = ? AND s.client_id = ?
      `)
      .bind(params.id, clientId)
      .first<Subscription & {
        package_name: string;
        package_description: string;
        price_monthly: number;
        price_annual: number;
        features: string;
      }>();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Parse features
    const formattedSubscription = {
      ...subscription,
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      service_package: {
        id: subscription.service_package_id,
        name: subscription.package_name,
        description: subscription.package_description,
        price_monthly: subscription.price_monthly,
        price_annual: subscription.price_annual,
        features: subscription.features ? JSON.parse(subscription.features) : [],
      },
    };

    return NextResponse.json({ subscription: formattedSubscription });
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments/subscriptions/[id]
 * Cancel a subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Migrated to Vercel Postgres
    // Get client ID for the authenticated user
    const clientId = await getUserClientId(userId);

    // Get subscription
    const subscription = await db
      .prepare(`
        SELECT id, client_id, paypal_subscription_id, status
        FROM subscriptions
        WHERE id = ? AND client_id = ?
      `)
      .bind(params.id, clientId)
      .first<Subscription>();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if subscription can be cancelled
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be cancelled' },
        { status: 400 }
      );
    }

    if (!subscription.paypal_subscription_id) {
      return NextResponse.json(
        { error: 'PayPal subscription ID not found' },
        { status: 400 }
      );
    }

    // Cancel subscription in PayPal
    await cancelPayPalSubscription(
      env,
      subscription.paypal_subscription_id,
      'Customer requested cancellation'
    );

    // Update subscription status in database
    const now = new Date().toISOString();
    await db
      .prepare(`
        UPDATE subscriptions
        SET status = 'cancelled',
            cancel_at_period_end = 1,
            updated_at = ?
        WHERE id = ?
      `)
      .bind(now, params.id)
      .run();

    // Get updated subscription details from PayPal
    try {
      const paypalSub = await getPayPalSubscription(env, subscription.paypal_subscription_id);
      
      // Update next billing date if available
      if (paypalSub.billing_info?.next_billing_time) {
        await db
          .prepare(`
            UPDATE subscriptions
            SET next_billing_date = ?
            WHERE id = ?
          `)
          .bind(paypalSub.billing_info.next_billing_time, params.id)
          .run();
      }
    } catch (error) {
      console.error('Failed to get PayPal subscription details:', error);
      // Continue even if we can't get PayPal details
    }

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription_id: params.id,
    });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
