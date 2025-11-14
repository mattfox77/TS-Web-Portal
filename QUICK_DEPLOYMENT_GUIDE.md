# Quick Deployment Guide

This is a condensed guide for experienced developers. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account
- GitHub repository

## 1. Cloudflare Setup (5 minutes)

```bash
# Login to Cloudflare
wrangler login

# Create production database
wrangler d1 create tech-support-db-production
# Copy database_id and update wrangler.toml

# Create R2 bucket
wrangler r2 bucket create tech-support-documents-production
```

## 2. Initialize Resources (2 minutes)

```bash
# Run automated setup
./scripts/init-production.sh

# Or manually:
wrangler d1 execute tech-support-db-production --remote --file=./schema.sql
wrangler d1 execute tech-support-db-production --remote --file=./scripts/seed-data.sql
```

## 3. Configure Environment Variables (10 minutes)

Get credentials from:
- **Clerk**: https://dashboard.clerk.com → API Keys
- **PayPal**: https://developer.paypal.com/dashboard → Apps & Credentials
- **GitHub**: https://github.com/settings/tokens
- **SendGrid**: https://app.sendgrid.com → Settings → API Keys

Add to Cloudflare Pages:
```bash
# Required variables (16 total)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=WH-xxxxx
GITHUB_TOKEN=ghp_xxxxx
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
# ... plus 5 Clerk URL variables
```

Validate:
```bash
./scripts/validate-env.sh
```

## 4. Connect GitHub to Cloudflare (3 minutes)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create application → Pages → Connect to Git
3. Select repository
4. Configure:
   - Build command: `npm run pages:build`
   - Build output: `.vercel/output/static`
   - Production branch: `main`

## 5. Bind Resources (2 minutes)

In Cloudflare Pages Settings → Functions:
- Add D1 binding: `DB` → `tech-support-db-production`
- Add R2 binding: `DOCUMENTS` → `tech-support-documents-production`

## 6. Deploy (2 minutes)

```bash
# Via script
./scripts/deploy-production.sh

# Or via Cloudflare dashboard
# Deployments → Create deployment → main branch

# Or push to main (if GitHub Actions configured)
git push origin main
```

## 7. Configure Webhooks (5 minutes)

**Clerk**: Dashboard → Webhooks → Add Endpoint
- URL: `https://portal.yourdomain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`

**PayPal**: Developer Dashboard → Your App → Webhooks
- URL: `https://portal.yourdomain.com/api/webhooks/paypal`
- Events: All payment and subscription events

**GitHub**: Repository → Settings → Webhooks
- URL: `https://portal.yourdomain.com/api/webhooks/github`
- Events: Issues

## 8. Create Admin User (1 minute)

```bash
./scripts/create-admin-user.sh
# Enter Clerk user ID and details when prompted
```

## 9. Verify Deployment (5 minutes)

```bash
# Run health check
./scripts/check-health.sh https://portal.yourdomain.com

# Test webhooks
./scripts/test-webhooks.sh https://portal.yourdomain.com

# Manual tests:
# - Register new user
# - Create ticket
# - Upload document
# - Create invoice (admin)
# - Test payment
```

## 10. Set Up Monitoring (5 minutes)

**UptimeRobot** (free):
1. Sign up at https://uptimerobot.com
2. Add monitor: `https://portal.yourdomain.com`
3. Add API monitor: `https://portal.yourdomain.com/api/health`

**Cloudflare Notifications**:
1. Dashboard → Notifications
2. Add alert: Pages Deployment Failed
3. Add alert: Workers Error Rate

## Total Time: ~40 minutes

## Quick Commands

```bash
# Validate environment
./scripts/validate-env.sh

# Initialize production
./scripts/init-production.sh

# Deploy
./scripts/deploy-production.sh

# Create admin
./scripts/create-admin-user.sh

# Test webhooks
./scripts/test-webhooks.sh https://portal.yourdomain.com

# Check health
./scripts/check-health.sh https://portal.yourdomain.com

# Stream logs
wrangler pages deployment tail --project-name=tech-support-client-portal

# Query database
npm run db:query:production "SELECT COUNT(*) FROM clients"
```

## Troubleshooting

**Build fails**: Check Node version, clear node_modules, reinstall
**Database error**: Verify binding, check database_id in wrangler.toml
**Webhook fails**: Verify secrets, check webhook URLs
**Environment vars**: Run `./scripts/validate-env.sh`

## Full Documentation

- [Complete Deployment Guide](./DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Cloudflare Setup](./CLOUDFLARE_SETUP.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Database Setup](./DATABASE_STORAGE_SETUP.md)
- [Webhook Setup](./WEBHOOK_SETUP.md)
- [Monitoring Setup](./MONITORING_SETUP.md)

## Support

- Cloudflare: https://community.cloudflare.com
- Clerk: https://clerk.com/support
- PayPal: https://developer.paypal.com/support
- SendGrid: https://support.sendgrid.com
