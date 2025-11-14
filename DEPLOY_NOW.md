# Deploy to Vercel - Quick Guide

## Prerequisites Done ✅
- Migration to Vercel Postgres: COMPLETE
- All API routes updated: COMPLETE
- TypeScript errors: NONE

## Deploy Steps

### 1. Login to Vercel
```bash
npx vercel login
```

### 2. Link Project (First Time)
```bash
npx vercel link
```

### 3. Set Environment Variables
You need to set these in Vercel dashboard or via CLI:

**Required:**
- `POSTGRES_URL` - Vercel Postgres connection string
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key

**Optional:**
- `GITHUB_TOKEN` - For GitHub integration
- `GITHUB_WEBHOOK_SECRET` - For GitHub webhooks
- `SENDGRID_API_KEY` - For email notifications
- `SENDGRID_FROM_EMAIL` - From email address
- `PAYPAL_CLIENT_ID` - PayPal integration
- `PAYPAL_CLIENT_SECRET` - PayPal secret
- `PAYPAL_MODE` - sandbox or live

### 4. Deploy
```bash
# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod
```

## Database Setup

After deployment, you need to:

1. Create Vercel Postgres database in dashboard
2. Run schema migration:
```bash
# Copy schema-postgres.sql content to Vercel Postgres SQL editor
# Or use psql:
psql $POSTGRES_URL < schema-postgres.sql
```

## Quick Deploy Command
```bash
npx vercel --prod
```

That's it! Your site will be live on Vercel.
