# API Usage Budget Alerts Setup

This document explains how to configure and use the API usage budget alert system.

## Overview

The usage alert system monitors API usage costs for projects and sends email notifications when budget thresholds are exceeded. This helps prevent unexpected costs and allows proactive management of API consumption.

## Features

- **Budget Thresholds**: Set maximum budget limits per project
- **Alert Thresholds**: Configure when to send alerts (default: 80% of budget)
- **Automatic Checks**: Schedule automated budget checks via Cloudflare Cron Triggers
- **Email Notifications**: Receive alerts when thresholds are exceeded
- **Rate Limiting**: Alerts are sent at most once per 24 hours per project

## Database Schema

The following columns were added to the `projects` table:

```sql
ALTER TABLE projects ADD COLUMN budget_threshold_usd REAL DEFAULT NULL;
ALTER TABLE projects ADD COLUMN budget_alert_threshold_percent INTEGER DEFAULT 80;
ALTER TABLE projects ADD COLUMN last_budget_alert_sent TEXT DEFAULT NULL;
```

To apply this migration:

```bash
npx wrangler d1 execute tech-support-db --remote --file=./migrations/add_usage_budget_thresholds.sql
```

## Setting Budget Thresholds

### Via API

Update a project's budget settings:

```bash
curl -X PATCH https://your-domain.com/api/admin/projects/{project_id}/budget \
  -H "Content-Type: application/json" \
  -d '{
    "budget_threshold_usd": 100.00,
    "budget_alert_threshold_percent": 80
  }'
```

Get current budget status:

```bash
curl https://your-domain.com/api/admin/projects/{project_id}/budget
```

### Via Admin UI

Budget settings can be added to the project edit page in the admin dashboard.

## Manual Budget Checks

### Dry Run (Check without sending alerts)

```bash
curl https://your-domain.com/api/admin/usage/check-budgets
```

### Send Alerts

```bash
curl -X POST https://your-domain.com/api/admin/usage/check-budgets
```

## Automated Budget Checks with Cloudflare Cron Triggers

### Option 1: Using wrangler.toml

Add a cron trigger to your `wrangler.toml`:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Run every 6 hours
```

Then create a scheduled handler in your Pages Functions:

```typescript
// functions/scheduled.ts
export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  // Import and run budget check
  const { checkBudgetThresholds, sendBudgetAlerts } = await import('../lib/usage-alerts');
  const { sendEmail } = await import('../lib/email');
  
  const sendEmailWrapper = async (to: string, template: any) => {
    await sendEmail(env, to, template);
  };
  
  const alertsSent = await sendBudgetAlerts(env.DB, sendEmailWrapper);
  
  return new Response(JSON.stringify({ alerts_sent: alertsSent }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

### Option 2: Using Cloudflare Workers Cron Triggers

1. Go to Cloudflare Dashboard → Workers & Pages → Your Project
2. Navigate to Settings → Triggers → Cron Triggers
3. Add a new cron trigger with schedule: `0 */6 * * *` (every 6 hours)
4. The trigger will call your scheduled handler

### Option 3: External Cron Service

Use a service like cron-job.org or EasyCron to call the API endpoint:

```
POST https://your-domain.com/api/admin/usage/check-budgets
```

Schedule: Every 6 hours or as needed

**Note**: You'll need to implement authentication for external cron services (e.g., API key in header).

## Alert Email Format

When a budget threshold is exceeded, an email is sent with:

- Project name and current status
- Budget threshold amount
- Current usage amount
- Usage percentage
- Link to view detailed usage analytics
- Action recommendations

## Configuration Options

### Budget Threshold (budget_threshold_usd)

- Set to `NULL` to disable budget tracking for a project
- Set to a positive number (e.g., `100.00`) to enable tracking
- Represents the maximum allowed cost in USD

### Alert Threshold Percent (budget_alert_threshold_percent)

- Default: `80` (send alert at 80% of budget)
- Range: 1-100
- Determines when to send the first alert
- Alerts continue if usage increases further (once per 24 hours)

### Alert Frequency

- Maximum: Once per 24 hours per project
- Prevents alert spam while keeping you informed
- Tracked via `last_budget_alert_sent` timestamp

## Best Practices

1. **Set Realistic Budgets**: Base thresholds on historical usage patterns
2. **Monitor Regularly**: Check the usage analytics dashboard weekly
3. **Adjust Thresholds**: Update budgets as project needs change
4. **Test Alerts**: Use the dry run endpoint to verify configuration
5. **Document Limits**: Communicate budget limits to development teams

## Troubleshooting

### Alerts Not Sending

1. Check that `budget_threshold_usd` is set and greater than 0
2. Verify email service is configured correctly
3. Check `last_budget_alert_sent` - alerts are rate-limited to once per 24 hours
4. Review application logs for email sending errors

### False Alerts

1. Verify pricing data in `lib/pricing.ts` is up to date
2. Check for duplicate usage records in `api_usage` table
3. Ensure usage tracking is recording costs correctly

### Missing Usage Data

1. Verify external applications are calling `/api/usage` endpoint
2. Check authentication is working for usage tracking
3. Review API logs for errors

## API Endpoints

### Usage Tracking

- `POST /api/usage` - Record API usage
- `GET /api/usage` - Get usage data for authenticated user

### Admin Endpoints

- `GET /api/admin/usage` - Get aggregated usage analytics
- `GET /api/admin/usage/check-budgets` - Check budgets (dry run)
- `POST /api/admin/usage/check-budgets` - Check budgets and send alerts
- `GET /api/admin/projects/{id}/budget` - Get project budget settings
- `PATCH /api/admin/projects/{id}/budget` - Update project budget settings

## Example Workflow

1. **Create Project**: Set up a new project in the admin dashboard
2. **Set Budget**: Configure budget threshold (e.g., $100/month)
3. **Track Usage**: External app calls `/api/usage` to record API calls
4. **Automated Checks**: Cron trigger runs every 6 hours
5. **Alert Sent**: Email notification when usage reaches 80% ($80)
6. **Review Usage**: Admin checks usage analytics dashboard
7. **Take Action**: Increase budget or optimize API usage

## Security Considerations

- Budget check endpoints require admin authentication
- Usage tracking requires valid user authentication
- Email alerts only sent to client email addresses
- All budget data stored securely in D1 database
- Audit logs track all budget configuration changes
