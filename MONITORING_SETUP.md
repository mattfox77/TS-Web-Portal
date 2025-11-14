# Monitoring and Alerts Setup Guide

This guide covers setting up monitoring, logging, and alerting for the Tech Support Client Portal in production.

## Table of Contents

1. [Overview](#overview)
2. [Cloudflare Analytics](#cloudflare-analytics)
3. [Application Logging](#application-logging)
4. [Uptime Monitoring](#uptime-monitoring)
5. [Error Tracking](#error-tracking)
6. [Performance Monitoring](#performance-monitoring)
7. [Alerts Configuration](#alerts-configuration)
8. [Monitoring Dashboard](#monitoring-dashboard)

---

## Overview

### Monitoring Strategy

The portal uses a multi-layered monitoring approach:

1. **Infrastructure**: Cloudflare Analytics (built-in, free)
2. **Uptime**: UptimeRobot (free tier: 50 monitors)
3. **Errors**: Application logs + optional Sentry
4. **Performance**: Cloudflare Web Analytics
5. **Business Metrics**: Custom dashboard queries

### Key Metrics to Monitor

**Infrastructure**:
- Request volume and response times
- Error rates (4xx, 5xx)
- Geographic distribution
- Cache hit rates

**Application**:
- User registrations
- Ticket creation rate
- Invoice generation
- Payment success rate
- Document uploads

**Database**:
- Query performance
- Storage usage
- Read/write operations

**Business**:
- Active users
- Open tickets
- Revenue (paid invoices)
- Subscription status

---

## Cloudflare Analytics

Cloudflare provides built-in analytics for all Pages projects.

### Access Analytics

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Select **tech-support-client-portal**
4. Click **Analytics**

### Available Metrics

**Traffic**:
- Total requests
- Unique visitors
- Bandwidth usage
- Requests by country

**Performance**:
- Response time (p50, p95, p99)
- Time to first byte (TTFB)
- Cache hit ratio

**Errors**:
- 4xx errors (client errors)
- 5xx errors (server errors)
- Error rate percentage

**Workers**:
- CPU time
- Subrequests
- Duration

### Custom Analytics

Add custom analytics to track business metrics:

```typescript
// lib/analytics.ts

export async function trackEvent(
  env: Env,
  event: {
    name: string;
    properties?: Record<string, any>;
  }
): Promise<void> {
  // Log to Cloudflare Analytics
  console.log('Analytics Event:', JSON.stringify(event));
  
  // Optional: Send to external analytics service
  // await fetch('https://analytics.example.com/track', {
  //   method: 'POST',
  //   body: JSON.stringify(event),
  // });
}

// Usage in API routes
await trackEvent(env, {
  name: 'ticket_created',
  properties: {
    client_id: ticket.client_id,
    priority: ticket.priority,
  },
});
```

### Analytics API

Query analytics programmatically:

```bash
# Get analytics data
curl -X GET "https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql" \
  -H "Authorization: Bearer {api_token}" \
  -d "SELECT * FROM analytics WHERE timestamp > NOW() - INTERVAL '24' HOUR"
```

---

## Application Logging

### Real-Time Log Streaming

Stream production logs in real-time:

```bash
# Stream all logs
wrangler pages deployment tail --project-name=tech-support-client-portal

# Filter logs
wrangler pages deployment tail --project-name=tech-support-client-portal \
  | grep "ERROR"

# Save logs to file
wrangler pages deployment tail --project-name=tech-support-client-portal \
  > logs-$(date +%Y%m%d).txt
```

### Structured Logging

Implement structured logging in your application:

```typescript
// lib/logger.ts

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

export function log(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  // Log to console (captured by Cloudflare)
  const logFn = level === LogLevel.ERROR ? console.error : console.log;
  logFn(JSON.stringify(entry));
}

// Usage
log(LogLevel.INFO, 'User logged in', { user_id: 'user_123' });
log(LogLevel.ERROR, 'Payment failed', { invoice_id: 'inv_456' }, error);
```

### Log Retention

Cloudflare retains logs for:
- **Real-time streaming**: Available while streaming
- **Historical logs**: Not available in free tier

For long-term log retention, consider:
1. Stream logs to external service (e.g., Logtail, Papertrail)
2. Store logs in R2 bucket
3. Use Cloudflare Logpush (paid feature)

### Log Aggregation

Set up log aggregation for better analysis:

```typescript
// scripts/aggregate-logs.ts

interface LogAggregation {
  error_count: number;
  warning_count: number;
  info_count: number;
  top_errors: Array<{ message: string; count: number }>;
}

async function aggregateLogs(
  logs: LogEntry[]
): Promise<LogAggregation> {
  const aggregation: LogAggregation = {
    error_count: 0,
    warning_count: 0,
    info_count: 0,
    top_errors: [],
  };

  const errorCounts = new Map<string, number>();

  for (const log of logs) {
    switch (log.level) {
      case LogLevel.ERROR:
        aggregation.error_count++;
        const count = errorCounts.get(log.message) || 0;
        errorCounts.set(log.message, count + 1);
        break;
      case LogLevel.WARN:
        aggregation.warning_count++;
        break;
      case LogLevel.INFO:
        aggregation.info_count++;
        break;
    }
  }

  aggregation.top_errors = Array.from(errorCounts.entries())
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return aggregation;
}
```

---

## Uptime Monitoring

Use UptimeRobot for external uptime monitoring.

### Step 1: Create UptimeRobot Account

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Sign up for free account (50 monitors, 5-minute intervals)
3. Verify email address

### Step 2: Add HTTP(S) Monitor

1. Click **Add New Monitor**
2. Configure:

**Monitor Type**: HTTPS

**Friendly Name**: Tech Support Portal - Homepage

**URL**: `https://portal.yourdomain.com`

**Monitoring Interval**: 5 minutes

**Monitor Timeout**: 30 seconds

**Alert Contacts**: Add your email

3. Click **Create Monitor**

### Step 3: Add API Endpoint Monitors

Add monitors for critical API endpoints:

**Monitor 1: Authentication**
- URL: `https://portal.yourdomain.com/api/auth/user`
- Expected: 401 (requires auth)

**Monitor 2: Health Check**
- URL: `https://portal.yourdomain.com/api/health`
- Expected: 200

**Monitor 3: Public API**
- URL: `https://portal.yourdomain.com/api/service-packages`
- Expected: 200

### Step 4: Configure Alert Contacts

1. Go to **My Settings** → **Alert Contacts**
2. Add contacts:
   - Email (verified)
   - SMS (optional, paid)
   - Slack webhook (optional)
   - Discord webhook (optional)

### Step 5: Set Up Status Page (Optional)

1. Go to **Status Pages**
2. Click **Add New Status Page**
3. Select monitors to display
4. Customize branding
5. Get public URL: `https://stats.uptimerobot.com/xxxxx`

### Alternative: Cloudflare Health Checks

For paid Cloudflare plans:

1. Go to **Traffic** → **Health Checks**
2. Create health check for your domain
3. Configure notification preferences

---

## Error Tracking

### Option 1: Application Logs (Free)

Use structured logging (see above) and monitor logs regularly.

### Option 2: Sentry (Recommended)

Sentry provides advanced error tracking and debugging.

#### Step 1: Create Sentry Account

1. Go to [Sentry.io](https://sentry.io)
2. Sign up for free account (5,000 errors/month)
3. Create new project: **Next.js**

#### Step 2: Install Sentry SDK

```bash
npm install @sentry/nextjs
```

#### Step 3: Configure Sentry

Run the Sentry wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

#### Step 4: Add Sentry DSN

Add to environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxx
```

#### Step 5: Configure Error Boundaries

```typescript
// app/error.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

#### Step 6: Track Custom Errors

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'payment',
      invoice_id: invoiceId,
    },
    level: 'error',
  });
}
```

#### Step 7: Configure Alerts

In Sentry dashboard:
1. Go to **Alerts** → **Create Alert**
2. Configure:
   - **Alert name**: High Error Rate
   - **Conditions**: Error count > 10 in 5 minutes
   - **Actions**: Send email notification
3. Click **Save Rule**

---

## Performance Monitoring

### Cloudflare Web Analytics

1. Go to Cloudflare dashboard
2. Navigate to **Analytics** → **Web Analytics**
3. Add your site
4. Copy the beacon script
5. Add to `app/layout.tsx`:

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Cloudflare Web Analytics */}
        <script
          defer
          src='https://static.cloudflareinsights.com/beacon.min.js'
          data-cf-beacon='{"token": "your-token-here"}'
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Core Web Vitals

Monitor Core Web Vitals using Next.js built-in reporting:

```typescript
// app/web-vitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log to console
    console.log(metric);

    // Send to analytics
    if (typeof window !== 'undefined') {
      // Send to your analytics service
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        body: JSON.stringify(metric),
      });
    }
  });

  return null;
}
```

Add to layout:

```typescript
import { WebVitals } from './web-vitals';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

### Lighthouse CI

Run Lighthouse audits automatically:

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://portal.yourdomain.com
```

Add to GitHub Actions:

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --collect.url=https://portal.yourdomain.com
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## Alerts Configuration

### Cloudflare Notifications

1. Go to Cloudflare dashboard
2. Navigate to **Notifications**
3. Click **Add**

**Available Alerts**:

**Pages Deployment Failed**:
- Trigger: Deployment fails
- Action: Send email

**Pages Deployment Success**:
- Trigger: Deployment succeeds
- Action: Send email (optional)

**Workers Error Rate**:
- Trigger: Error rate > threshold
- Action: Send email

**D1 Database**:
- Trigger: Storage > 80%
- Action: Send email

**R2 Storage**:
- Trigger: Storage > 80%
- Action: Send email

### Email Alerts

Configure email alerts for critical events:

```typescript
// lib/alerts.ts

export async function sendAlert(
  env: Env,
  alert: {
    level: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  const email = {
    to: 'alerts@yourdomain.com',
    subject: `[${alert.level.toUpperCase()}] ${alert.title}`,
    html: `
      <h2>${alert.title}</h2>
      <p>${alert.message}</p>
      ${alert.details ? `<pre>${JSON.stringify(alert.details, null, 2)}</pre>` : ''}
    `,
  };

  await sendEmail(env, email.to, {
    subject: email.subject,
    html: email.html,
    text: alert.message,
  });
}

// Usage
await sendAlert(env, {
  level: 'critical',
  title: 'Payment Processing Failed',
  message: 'Multiple payment failures detected in the last hour',
  details: {
    failed_count: 5,
    time_range: 'last_hour',
  },
});
```

### Slack Notifications

Integrate with Slack for team notifications:

```typescript
// lib/slack.ts

export async function sendSlackNotification(
  webhookUrl: string,
  message: {
    text: string;
    blocks?: any[];
  }
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

// Usage
await sendSlackNotification(env.SLACK_WEBHOOK_URL, {
  text: 'New ticket created',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*New Ticket*\n${ticket.title}`,
      },
    },
  ],
});
```

---

## Monitoring Dashboard

### Create Custom Dashboard

Build a monitoring dashboard to view key metrics:

```typescript
// app/admin/monitoring/page.tsx

export default async function MonitoringPage() {
  const stats = await getMonitoringStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Monitoring</h1>

      {/* System Health */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Uptime"
          value={stats.uptime}
          unit="%"
          status="success"
        />
        <MetricCard
          title="Response Time"
          value={stats.responseTime}
          unit="ms"
          status={stats.responseTime < 500 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Error Rate"
          value={stats.errorRate}
          unit="%"
          status={stats.errorRate < 1 ? 'success' : 'error'}
        />
        <MetricCard
          title="Active Users"
          value={stats.activeUsers}
          status="info"
        />
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="DB Storage"
          value={stats.dbStorage}
          unit="MB"
          max={5000}
        />
        <MetricCard
          title="DB Reads"
          value={stats.dbReads}
          unit="/day"
          max={5000000}
        />
        <MetricCard
          title="DB Writes"
          value={stats.dbWrites}
          unit="/day"
          max={100000}
        />
      </div>

      {/* R2 Stats */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="R2 Storage"
          value={stats.r2Storage}
          unit="GB"
          max={10}
        />
        <MetricCard
          title="R2 Operations"
          value={stats.r2Operations}
          unit="/month"
          max={1000000}
        />
      </div>

      {/* Recent Errors */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
        <ErrorList errors={stats.recentErrors} />
      </div>
    </div>
  );
}
```

### Monitoring API Endpoint

```typescript
// app/api/admin/monitoring/route.ts

export async function GET(request: NextRequest) {
  const userId = await requireAdmin(request);
  const { env } = getRequestContext();

  // Get system stats
  const stats = {
    uptime: await calculateUptime(env.DB),
    responseTime: await getAverageResponseTime(env.DB),
    errorRate: await getErrorRate(env.DB),
    activeUsers: await getActiveUserCount(env.DB),
    dbStorage: await getDatabaseSize(env.DB),
    dbReads: await getDatabaseReads(env.DB),
    dbWrites: await getDatabaseWrites(env.DB),
    r2Storage: await getR2StorageSize(env.DOCUMENTS),
    r2Operations: await getR2Operations(env.DOCUMENTS),
    recentErrors: await getRecentErrors(env.DB),
  };

  return NextResponse.json(stats);
}
```

---

## Monitoring Checklist

Use this checklist to ensure monitoring is properly configured:

### Infrastructure Monitoring
- [ ] Cloudflare Analytics enabled
- [ ] Log streaming tested
- [ ] Structured logging implemented
- [ ] Log retention strategy defined

### Uptime Monitoring
- [ ] UptimeRobot account created
- [ ] Homepage monitor added
- [ ] API endpoint monitors added
- [ ] Alert contacts configured
- [ ] Status page created (optional)

### Error Tracking
- [ ] Error logging implemented
- [ ] Sentry configured (optional)
- [ ] Error alerts set up
- [ ] Error dashboard accessible

### Performance Monitoring
- [ ] Web Analytics enabled
- [ ] Core Web Vitals tracked
- [ ] Lighthouse CI configured
- [ ] Performance alerts set up

### Alerts
- [ ] Cloudflare notifications configured
- [ ] Email alerts tested
- [ ] Slack integration set up (optional)
- [ ] Alert escalation defined

### Dashboard
- [ ] Monitoring dashboard created
- [ ] Key metrics displayed
- [ ] Real-time updates working
- [ ] Team has access

---

## Best Practices

1. **Monitor what matters** - Focus on metrics that impact users
2. **Set realistic thresholds** - Avoid alert fatigue
3. **Review regularly** - Check dashboards weekly
4. **Document incidents** - Keep a log of issues and resolutions
5. **Test alerts** - Verify alerts work before you need them
6. **Automate responses** - Auto-scale or restart when possible
7. **Keep team informed** - Share monitoring access with team
8. **Plan for growth** - Monitor usage trends
9. **Backup monitoring data** - Export important metrics
10. **Stay within free tiers** - Monitor usage to avoid costs

---

## Support Resources

- [Cloudflare Analytics](https://developers.cloudflare.com/analytics)
- [UptimeRobot Documentation](https://uptimerobot.com/help)
- [Sentry Documentation](https://docs.sentry.io)
- [Next.js Analytics](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)

---

## Next Steps

After setting up monitoring:

1. ✅ Monitor for 24 hours to establish baseline
2. ✅ Adjust alert thresholds based on actual usage
3. ✅ Create runbooks for common issues
4. ✅ Train team on monitoring tools
5. ✅ Schedule regular monitoring reviews
6. ✅ Document escalation procedures
