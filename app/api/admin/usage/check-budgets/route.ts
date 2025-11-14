// app/api/admin/usage/check-budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { checkBudgetThresholds, sendBudgetAlerts } from '@/lib/usage-alerts';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { sql } from "@vercel/postgres";

/**
 * POST /api/admin/usage/check-budgets
 * Manually trigger budget threshold checks and send alerts
 * 
 * This endpoint can be called manually or scheduled via Cloudflare Cron Triggers
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    // Check for projects exceeding budget thresholds
    const projectsToAlert = await checkBudgetThresholds(db);

    if (projectsToAlert.length === 0) {
      return NextResponse.json({
        message: 'No budget alerts needed',
        projects_checked: 0,
        alerts_sent: 0,
      });
    }

    // Send alerts using the email utility
    const sendEmailWrapper = async (
      to: string,
      template: { subject: string; html: string; text: string }
    ) => {
      await sendEmail(env, to, template);
    };

    const alertsSent = await sendBudgetAlerts(db, sendEmailWrapper);

    return NextResponse.json({
      message: `Budget alerts processed`,
      projects_checked: projectsToAlert.length,
      alerts_sent: alertsSent,
      projects: projectsToAlert.map((p) => ({
        project_id: p.project_id,
        project_name: p.project_name,
        usage_percentage: p.usage_percentage.toFixed(1) + '%',
        current_usage: p.current_usage_usd,
        threshold: p.budget_threshold_usd,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/admin/usage/check-budgets
 * Check budget thresholds without sending alerts (dry run)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Migrated to Vercel Postgres
    // Check for projects exceeding budget thresholds
    const projectsToAlert = await checkBudgetThresholds(db);

    return NextResponse.json({
      message: 'Budget check completed (dry run)',
      projects_needing_alerts: projectsToAlert.length,
      projects: projectsToAlert.map((p) => ({
        project_id: p.project_id,
        project_name: p.project_name,
        client_name: p.client_name,
        usage_percentage: p.usage_percentage.toFixed(1) + '%',
        current_usage: p.current_usage_usd,
        threshold: p.budget_threshold_usd,
        alert_threshold: p.alert_threshold_percent + '%',
        last_alert_sent: p.last_alert_sent,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}
