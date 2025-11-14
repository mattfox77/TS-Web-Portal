import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getUserClientId } from "@/lib/auth";
import { createPayPalSubscriptionPlan, createPayPalSubscription } from "@/lib/paypal-subscriptions";
import { ServicePackage, Subscription } from "@/types";
import { z } from "zod";
import { sql } from "@vercel/postgres";

/**
 * POST /api/payments/subscriptions
 * Create a new subscription for a service package
 */
export const runtime = 'edge';

const createSubscriptionSchema = z.object({
  service_package_id: z.string().min(1),
  billing_cycle: z.enum(['monthly', 'annual']),
});

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const { service_package_id, billing_cycle } = createSubscriptionSchema.parse(body);

    // Get service package details
    const servicePackage = await db
      .prepare(`
        SELECT id, name, description, price_monthly, price_annual, features, is_active
        FROM service_packages
        WHERE id = ? AND is_active = 1
      `)
      .bind(service_package_id)
      .first<ServicePackage>();

    if (!servicePackage) {
      return NextResponse.json(
        { error: 'Service package not found or inactive' },
        { status: 404 }
      );
    }

    // Parse features if it's a string
    if (typeof servicePackage.features === 'string') {
      servicePackage.features = JSON.parse(servicePackage.features);
    }

    // Check if client already has an active subscription for this package
    const existingSubscription = await db
      .prepare(`
        SELECT id, status
        FROM subscriptions
        WHERE client_id = ? 
          AND service_package_id = ? 
          AND status IN ('active', 'suspended')
      `)
      .bind(clientId, service_package_id)
      .first<{ id: string; status: string }>();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription for this package' },
        { status: 409 }
      );
    }

    // Create PayPal subscription plan (or reuse existing one)
    // In production, you might want to cache plan IDs to avoid creating duplicates
    const planId = await createPayPalSubscriptionPlan(
      env,
      servicePackage,
      billing_cycle
    );

    // Create PayPal subscription
    const { subscription_id, approve_url } = await createPayPalSubscription(
      env,
      planId,
      clientId
    );

    // Create subscription record in database (status will be 'pending' until activated)
    const subscriptionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const startDate = new Date().toISOString();

    await db
      .prepare(`
        INSERT INTO subscriptions (
          id, client_id, service_package_id, paypal_subscription_id,
          status, billing_cycle, start_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        subscriptionId,
        clientId,
        service_package_id,
        subscription_id,
        'pending', // Will be updated to 'active' by webhook
        billing_cycle,
        startDate,
        now,
        now
      )
      .run();

    return NextResponse.json({
      subscription_id: subscriptionId,
      paypal_subscription_id: subscription_id,
      approve_url: approve_url,
      status: 'pending',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/subscriptions
 * Get all subscriptions for the authenticated user's client
 */
export async function GET(request: NextRequest) {
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

    // Get all subscriptions for the client
    const { results } = await db
      .prepare(`
        SELECT 
          s.id,
          s.client_id,
          s.service_package_id,
          s.paypal_subscription_id,
          s.status,
          s.billing_cycle,
          s.start_date,
          s.next_billing_date,
          s.cancel_at_period_end,
          s.created_at,
          s.updated_at,
          sp.name as package_name,
          sp.description as package_description,
          sp.price_monthly,
          sp.price_annual,
          sp.features
        FROM subscriptions s
        JOIN service_packages sp ON s.service_package_id = sp.id
        WHERE s.client_id = ?
        ORDER BY s.created_at DESC
      `)
      .bind(clientId)
      .all<Subscription & {
        package_name: string;
        package_description: string;
        price_monthly: number;
        price_annual: number;
        features: string;
      }>();

    // Parse features and format response
    const subscriptions = results.map(sub => ({
      ...sub,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      service_package: {
        id: sub.service_package_id,
        name: sub.package_name,
        description: sub.package_description,
        price_monthly: sub.price_monthly,
        price_annual: sub.price_annual,
        features: sub.features ? JSON.parse(sub.features) : [],
      },
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
