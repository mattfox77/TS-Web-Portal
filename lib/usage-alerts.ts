// lib/usage-alerts.ts
// Budget threshold checking and alert functions for API usage tracking

import { sql } from '@vercel/postgres';
import { formatCost } from './pricing';

export interface ProjectBudgetStatus {
  project_id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  client_email: string;
  budget_threshold_usd: number;
  current_usage_usd: number;
  usage_percentage: number;
  alert_threshold_percent: number;
  should_alert: boolean;
  last_alert_sent: string | null;
}

/**
 * Check all projects for budget threshold violations
 * Returns projects that have exceeded their alert threshold
 */
export async function checkBudgetThresholds(): Promise<ProjectBudgetStatus[]> {
  // Query projects with budget thresholds and their current usage
  const query = `
    SELECT 
      p.id as project_id,
      p.name as project_name,
      p.client_id,
      p.budget_threshold_usd,
      p.budget_alert_threshold_percent,
      p.last_budget_alert_sent,
      c.name as client_name,
      c.email as client_email,
      COALESCE(SUM(u.cost_usd), 0) as current_usage_usd
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    LEFT JOIN api_usage u ON u.project_id = p.id
    WHERE p.budget_threshold_usd IS NOT NULL
      AND p.budget_threshold_usd > 0
    GROUP BY p.id, p.name, p.client_id, p.budget_threshold_usd, 
             p.budget_alert_threshold_percent, p.last_budget_alert_sent,
             c.name, c.email
  `;

  const result = await sql.query(query);

  const projectStatuses: ProjectBudgetStatus[] = result.rows.map((row: any) => {
    const usagePercentage = (row.current_usage_usd / row.budget_threshold_usd) * 100;
    const alertThreshold = row.budget_alert_threshold_percent || 80;
    
    // Determine if we should send an alert
    // Alert if usage exceeds threshold AND we haven't sent an alert in the last 24 hours
    const shouldAlert = usagePercentage >= alertThreshold && 
      (!row.last_budget_alert_sent || 
       isMoreThan24HoursAgo(row.last_budget_alert_sent));

    return {
      project_id: row.project_id,
      project_name: row.project_name,
      client_id: row.client_id,
      client_name: row.client_name,
      client_email: row.client_email,
      budget_threshold_usd: row.budget_threshold_usd,
      current_usage_usd: row.current_usage_usd,
      usage_percentage: usagePercentage,
      alert_threshold_percent: alertThreshold,
      should_alert: shouldAlert,
      last_alert_sent: row.last_budget_alert_sent,
    };
  });

  return projectStatuses.filter((status) => status.should_alert);
}

/**
 * Check if a timestamp is more than 24 hours ago
 */
function isMoreThan24HoursAgo(timestamp: string): boolean {
  const then = new Date(timestamp).getTime();
  const now = Date.now();
  const hoursDiff = (now - then) / (1000 * 60 * 60);
  return hoursDiff >= 24;
}

/**
 * Update the last alert sent timestamp for a project
 */
export async function updateLastAlertSent(
  projectId: string
): Promise<void> {
  await sql.query(
    `UPDATE projects 
     SET last_budget_alert_sent = $1 
     WHERE id = $2`,
    [new Date().toISOString(), projectId]
  );
}

/**
 * Generate email template for budget alert
 */
export function getBudgetAlertEmail(status: ProjectBudgetStatus): {
  subject: string;
  html: string;
  text: string;
} {
  const percentageFormatted = status.usage_percentage.toFixed(1);
  const isOverBudget = status.usage_percentage >= 100;

  const subject = isOverBudget
    ? `⚠️ Budget Exceeded: ${status.project_name}`
    : `⚠️ Budget Alert: ${status.project_name} at ${percentageFormatted}%`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${isOverBudget ? '#dc2626' : '#f59e0b'};">
        ${isOverBudget ? 'Budget Exceeded' : 'Budget Alert'}
      </h2>
      
      <p>Your project <strong>${status.project_name}</strong> has ${
    isOverBudget ? 'exceeded' : 'reached'
  } its API usage budget threshold.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Project:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${status.project_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Budget Threshold:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${formatCost(
              status.budget_threshold_usd
            )}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Current Usage:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: ${
              isOverBudget ? '#dc2626' : '#f59e0b'
            };">
              <strong>${formatCost(status.current_usage_usd)}</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Usage Percentage:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: ${
              isOverBudget ? '#dc2626' : '#f59e0b'
            };">
              <strong>${percentageFormatted}%</strong>
            </td>
          </tr>
        </table>
      </div>
      
      ${
        isOverBudget
          ? '<p style="color: #dc2626;"><strong>Action Required:</strong> Your project has exceeded its budget. Please review your API usage or increase the budget threshold.</p>'
          : '<p style="color: #f59e0b;"><strong>Warning:</strong> Your project is approaching its budget limit. Consider reviewing your API usage.</p>'
      }
      
      <p>
        <a href="${process.env.APP_URL}/admin/usage?project_id=${
    status.project_id
  }" 
           style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          View Usage Details
        </a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
      
      <p style="color: #6b7280; font-size: 14px;">
        You can adjust budget thresholds and alert settings in your project configuration.
      </p>
    </div>
  `;

  const text = `
${isOverBudget ? 'BUDGET EXCEEDED' : 'BUDGET ALERT'}

Your project "${status.project_name}" has ${
    isOverBudget ? 'exceeded' : 'reached'
  } its API usage budget threshold.

Project: ${status.project_name}
Budget Threshold: ${formatCost(status.budget_threshold_usd)}
Current Usage: ${formatCost(status.current_usage_usd)}
Usage Percentage: ${percentageFormatted}%

${
  isOverBudget
    ? 'Action Required: Your project has exceeded its budget. Please review your API usage or increase the budget threshold.'
    : 'Warning: Your project is approaching its budget limit. Consider reviewing your API usage.'
}

View usage details: ${process.env.APP_URL}/admin/usage?project_id=${
    status.project_id
  }

You can adjust budget thresholds and alert settings in your project configuration.
  `.trim();

  return { subject, html, text };
}

/**
 * Send budget alert emails for projects that have exceeded thresholds
 */
export async function sendBudgetAlerts(
  sendEmailFn: (to: string, template: { subject: string; html: string; text: string }) => Promise<void>
): Promise<number> {
  const projectsToAlert = await checkBudgetThresholds();
  
  let alertsSent = 0;
  
  for (const status of projectsToAlert) {
    try {
      const emailTemplate = getBudgetAlertEmail(status);
      await sendEmailFn(status.client_email, emailTemplate);
      await updateLastAlertSent(status.project_id);
      alertsSent++;
      
      console.log(`Budget alert sent for project ${status.project_name} (${status.project_id})`);
    } catch (error) {
      console.error(`Failed to send budget alert for project ${status.project_id}:`, error);
    }
  }
  
  return alertsSent;
}
