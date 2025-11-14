# Complete Vercel Setup Guide

## Step 1: Add Vercel Postgres Database

1. Go to https://vercel.com/matt-foxs-projects/ts-web-portal
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name (e.g., "ts-portal-db")
6. Click "Create"

This will automatically add the `POSTGRES_URL` and related environment variables to your project.

## Step 2: Run Database Schema

After creating the database, you'll get a connection string. Use it to run the schema:

### Option A: Using Vercel Dashboard
1. In the Postgres database page, click "Query"
2. Copy the entire contents of `schema-postgres.sql`
3. Paste and run it

### Option B: Using psql locally
```bash
# Get the connection string from Vercel dashboard
# Then run:
psql "YOUR_POSTGRES_URL_HERE" < schema-postgres.sql
```

## Step 3: Add Environment Variables

Go to: https://vercel.com/matt-foxs-projects/ts-web-portal/settings/environment-variables

Add these variables:

### Required (Clerk Authentication)
```
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Optional (GitHub Integration)
```
GITHUB_TOKEN=ghp_...
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### Optional (Email via SendGrid)
```
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@techsupportcs.com
```

### Optional (PayPal)
```
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

## Step 4: Redeploy

After adding all environment variables:

```bash
npx vercel --prod
```

## Step 5: Verify Deployment

Visit your site and test:
- Sign up / Sign in
- Create a project
- Create a ticket
- View dashboard

## Quick Commands

```bash
# Check deployment status
npx vercel ls

# View logs
npx vercel logs

# Open in browser
npx vercel open
```

## Troubleshooting

If you see database errors:
1. Check that Postgres is added in Storage tab
2. Verify schema was run successfully
3. Check environment variables are set
4. Redeploy after changes

## Your Current Deployment

- **Project:** https://vercel.com/matt-foxs-projects/ts-web-portal
- **Production:** https://ts-web-portal-d04vkxxs7-matt-foxs-projects.vercel.app
- **Domain:** techsupportcomputerservices.com (if configured)
