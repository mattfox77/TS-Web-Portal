# Deployment Guide - Tech Support Client Portal

This guide covers deploying the Tech Support Client Portal to Cloudflare Pages with all necessary configurations.

## Prerequisites

- GitHub account with repository access
- Cloudflare account (free tier is sufficient)
- Node.js 18+ installed locally
- Wrangler CLI installed (`npm install -g wrangler`)

## Table of Contents

1. [Cloudflare Pages Setup](#cloudflare-pages-setup)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Storage Setup](#storage-setup)
5. [Webhook Configuration](#webhook-configuration)
6. [Custom Domain](#custom-domain)
7. [Monitoring](#monitoring)

---

## Cloudflare Pages Setup

### Step 1: Connect GitHub Repository

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select the repository: `tech-support-client-portal`
5. Click **Begin setup**

### Step 2: Configure Build Settings

Configure the following build settings:

| Setting | Value |
|---------|-------|
| **Production branch** | `main` |
| **Build command** | `npm run pages:build` |
| **Build output directory** | `.vercel/output/static` |
| **Root directory** | `/` (leave empty) |
| **Node version** | `18` or higher |

### Step 3: Environment Variables (Initial)

Add these environment variables in the Cloudflare Pages settings:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Application URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-project.pages.dev
```

**Note**: We'll add more environment variables after setting up other services.

### Step 4: Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (typically 2-5 minutes)
3. Once deployed, you'll receive a URL like: `https://tech-support-client-portal.pages.dev`

### Step 5: Configure Build Caching (Optional)

To speed up builds, enable build caching:

1. Go to **Settings** → **Builds & deployments**
2. Enable **Build cache**
3. Set cache key to: `${{ hashFiles('package-lock.json') }}`

---

## Environment Variables

### Complete Environment Variables List

After setting up all services, add these environment variables in Cloudflare Pages:

#### Authentication (Clerk)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### PayPal Integration
```bash
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=your_webhook_id
```

#### GitHub Integration
```bash
GITHUB_TOKEN=ghp_xxxxx
```

#### Email Service (SendGrid)
```bash
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

#### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
```

### How to Add Environment Variables

1. Go to **Workers & Pages** → Select your project
2. Click **Settings** → **Environment variables**
3. Add variables for **Production** environment
4. Click **Save**
5. Redeploy the application for changes to take effect

---

## Database Setup

### Step 1: Create Production D1 Database

```bash
# Login to Cloudflare
wrangler login

# Create production database
wrangler d1 create tech-support-db-production
```

This will output a database ID. Copy it for the next step.

### Step 2: Update wrangler.toml

Update the production database ID in `wrangler.toml`:

```toml
[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "tech-support-db-production"
database_id = "your-actual-production-database-id"
```

### Step 3: Initialize Database Schema

```bash
# Run schema on production database
wrangler d1 execute tech-support-db-production --remote --file=./schema.sql
```

### Step 4: Seed Initial Data

```bash
# Seed service packages and initial data
wrangler d1 execute tech-support-db-production --remote --file=./scripts/seed-data.sql
```

### Step 5: Bind Database to Pages Project

1. Go to **Workers & Pages** → Select your project
2. Click **Settings** → **Functions** → **D1 database bindings**
3. Add binding:
   - **Variable name**: `DB`
   - **D1 database**: Select `tech-support-db-production`
4. Click **Save**
5. Redeploy the application

### Verify Database Connection

After deployment, test the database connection:

```bash
# Query the database
wrangler d1 execute tech-support-db-production --remote --command "SELECT COUNT(*) FROM clients"
```

---

## Storage Setup

### Step 1: Create Production R2 Bucket

```bash
# Create R2 bucket for document storage
wrangler r2 bucket create tech-support-documents-production
```

### Step 2: Configure CORS (Optional)

If you need direct browser uploads, configure CORS:

```bash
# Create cors.json file
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://portal.yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply CORS configuration
wrangler r2 bucket cors put tech-support-documents-production --file=cors.json
```

### Step 3: Bind R2 Bucket to Pages Project

1. Go to **Workers & Pages** → Select your project
2. Click **Settings** → **Functions** → **R2 bucket bindings**
3. Add binding:
   - **Variable name**: `DOCUMENTS`
   - **R2 bucket**: Select `tech-support-documents-production`
4. Click **Save**
5. Redeploy the application

### Step 4: Configure Lifecycle Rules (Optional)

Set up automatic cleanup of old backups:

```bash
# Create lifecycle.json
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "backups/"
      },
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
EOF

# Apply lifecycle rules
wrangler r2 bucket lifecycle put tech-support-documents-production --file=lifecycle.json
```

---

## Webhook Configuration

### Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your production application
3. Navigate to **Webhooks** → **Add Endpoint**
4. Configure:
   - **Endpoint URL**: `https://portal.yourdomain.com/api/webhooks/clerk`
   - **Events**: Select `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret** and add it to Cloudflare Pages environment variables as `CLERK_WEBHOOK_SECRET`
6. Click **Create**

### PayPal Webhook

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Navigate to **Apps & Credentials** → Select your Live app
3. Scroll to **Webhooks** → **Add Webhook**
4. Configure:
   - **Webhook URL**: `https://portal.yourdomain.com/api/webhooks/paypal`
   - **Event types**: Select:
     - `PAYMENT.SALE.COMPLETED`
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
5. Copy the **Webhook ID** and add it to Cloudflare Pages environment variables as `PAYPAL_WEBHOOK_ID`
6. Click **Save**

### GitHub Webhook (Per Repository)

For each project repository that needs issue tracking:

1. Go to the GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://portal.yourdomain.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Generate a random secret and store it securely
   - **Events**: Select `Issues` (issue opened, closed, reopened)
4. Click **Add webhook**

### Test Webhook Delivery

After configuring webhooks, test them:

1. **Clerk**: Create a test user in Clerk dashboard
2. **PayPal**: Use PayPal sandbox to simulate a payment
3. **GitHub**: Create/close a test issue in a linked repository

Check webhook delivery status in each service's dashboard.

---

## Custom Domain

### Step 1: Add Custom Domain

1. Go to **Workers & Pages** → Select your project
2. Click **Custom domains** → **Set up a custom domain**
3. Enter your domain: `portal.yourdomain.com`
4. Click **Continue**

### Step 2: Configure DNS

Cloudflare will provide DNS records to add. If your domain is on Cloudflare:

1. The DNS records will be added automatically
2. Wait for SSL certificate provisioning (usually 1-5 minutes)

If your domain is elsewhere:

1. Add the provided CNAME record to your DNS provider:
   ```
   portal.yourdomain.com CNAME tech-support-client-portal.pages.dev
   ```
2. Wait for DNS propagation (up to 48 hours)

### Step 3: Update Environment Variables

After custom domain is active, update:

```bash
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
```

Then redeploy the application.

### Step 4: Update Webhook URLs

Update all webhook URLs in external services to use your custom domain:

- Clerk: `https://portal.yourdomain.com/api/webhooks/clerk`
- PayPal: `https://portal.yourdomain.com/api/webhooks/paypal`
- GitHub: `https://portal.yourdomain.com/api/webhooks/github`

---

## Monitoring

### Cloudflare Analytics

Built-in analytics are available in the Cloudflare dashboard:

1. Go to **Workers & Pages** → Select your project
2. Click **Analytics** to view:
   - Request volume
   - Response time
   - Error rates
   - Geographic distribution

### Uptime Monitoring

Set up external uptime monitoring with [UptimeRobot](https://uptimerobot.com) (free tier):

1. Create account at UptimeRobot
2. Add new monitor:
   - **Monitor Type**: HTTPS
   - **URL**: `https://portal.yourdomain.com`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Your email
3. Add API endpoint monitoring:
   - **URL**: `https://portal.yourdomain.com/api/health`
   - Create a simple health check endpoint if needed

### Error Tracking (Optional)

For advanced error tracking, integrate Sentry:

1. Create account at [Sentry.io](https://sentry.io)
2. Create new project for Next.js
3. Install Sentry SDK:
   ```bash
   npm install @sentry/nextjs
   ```
4. Run Sentry wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```
5. Add Sentry DSN to environment variables
6. Redeploy

### Log Monitoring

View real-time logs:

```bash
# Stream production logs
wrangler pages deployment tail --project-name=tech-support-client-portal
```

Or view logs in Cloudflare dashboard:
1. Go to **Workers & Pages** → Select your project
2. Click **Logs** → **Begin log stream**

---

## Deployment Checklist

Use this checklist for production deployment:

### Pre-Deployment
- [ ] All code merged to `main` branch
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] Backup strategy tested

### Cloudflare Setup
- [ ] GitHub repository connected
- [ ] Build settings configured
- [ ] Production D1 database created
- [ ] Database schema initialized
- [ ] Initial data seeded
- [ ] R2 bucket created
- [ ] Database binding added
- [ ] R2 binding added

### External Services
- [ ] Clerk production app created
- [ ] Clerk webhook configured
- [ ] PayPal live credentials obtained
- [ ] PayPal webhook configured
- [ ] GitHub token generated
- [ ] SendGrid account configured
- [ ] SendGrid sender verified

### Environment Variables
- [ ] All Clerk variables added
- [ ] All PayPal variables added
- [ ] GitHub token added
- [ ] SendGrid API key added
- [ ] App URL configured

### Domain & SSL
- [ ] Custom domain added
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] App URL updated in environment
- [ ] Webhook URLs updated

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] Ticket creation works
- [ ] Invoice payment works
- [ ] Document upload works
- [ ] Email notifications work
- [ ] Webhooks deliver successfully

### Monitoring
- [ ] Cloudflare Analytics enabled
- [ ] Uptime monitoring configured
- [ ] Error tracking configured (optional)
- [ ] Log monitoring tested
- [ ] Alert contacts configured

### Post-Deployment
- [ ] Create admin user
- [ ] Seed service packages
- [ ] Test all critical flows
- [ ] Document any issues
- [ ] Notify team of deployment

---

## Troubleshooting

### Build Failures

**Issue**: Build fails with "Module not found"
```bash
# Solution: Clear build cache and rebuild
wrangler pages deployment create --project-name=tech-support-client-portal --branch=main
```

**Issue**: Build timeout
```bash
# Solution: Optimize dependencies or split build steps
npm run build --max-old-space-size=4096
```

### Database Connection Issues

**Issue**: "Database binding not found"
```bash
# Solution: Verify binding in wrangler.toml and Cloudflare dashboard
wrangler pages deployment list --project-name=tech-support-client-portal
```

**Issue**: "Table does not exist"
```bash
# Solution: Re-run schema initialization
wrangler d1 execute tech-support-db-production --remote --file=./schema.sql
```

### Webhook Failures

**Issue**: Webhooks return 401 Unauthorized
- Verify webhook secrets are correctly set in environment variables
- Check signature verification logic

**Issue**: Webhooks return 500 Internal Server Error
- Check application logs for detailed error
- Verify database connection
- Test webhook payload manually

### Performance Issues

**Issue**: Slow page loads
- Check Cloudflare Analytics for bottlenecks
- Verify caching headers are set correctly
- Optimize database queries with indexes

**Issue**: High database read count
- Implement caching for frequently accessed data
- Use pagination for large result sets
- Optimize queries to reduce joins

---

## Rollback Procedure

If deployment issues occur:

### Option 1: Rollback via Dashboard

1. Go to **Workers & Pages** → Select your project
2. Click **Deployments**
3. Find the last working deployment
4. Click **⋯** → **Rollback to this deployment**

### Option 2: Rollback via CLI

```bash
# List recent deployments
wrangler pages deployment list --project-name=tech-support-client-portal

# Rollback to specific deployment
wrangler pages deployment rollback <deployment-id>
```

### Option 3: Redeploy Previous Commit

```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Trigger new deployment
git push origin main --force
```

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error rates in Cloudflare Analytics
- Check uptime monitoring alerts

**Weekly**:
- Review application logs for issues
- Check database size and performance
- Verify backup creation

**Monthly**:
- Review and optimize database queries
- Check R2 storage usage
- Update dependencies
- Review security advisories

### Database Maintenance

```bash
# Check database size
wrangler d1 execute tech-support-db-production --remote --command "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"

# Vacuum database (optimize)
wrangler d1 execute tech-support-db-production --remote --command "VACUUM"

# Analyze query performance
wrangler d1 execute tech-support-db-production --remote --command "ANALYZE"
```

### Backup Verification

```bash
# List recent backups
wrangler r2 object list tech-support-documents-production --prefix=backups/

# Download and verify backup
wrangler r2 object get tech-support-documents-production/backups/database-2024-01-01.sql --file=backup-test.sql
```

---

## Support

For deployment issues:

- **Cloudflare**: [Community Forum](https://community.cloudflare.com)
- **Next.js**: [GitHub Discussions](https://github.com/vercel/next.js/discussions)
- **Clerk**: [Support Portal](https://clerk.com/support)
- **PayPal**: [Developer Support](https://developer.paypal.com/support)

---

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Clerk Production Checklist](https://clerk.com/docs/deployments/production-checklist)
