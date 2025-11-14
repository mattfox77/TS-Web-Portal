# Setup Guide

This guide will walk you through setting up the Tech Support Client Portal from scratch.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18 or higher installed
- npm or yarn package manager
- A Cloudflare account
- A Clerk account (free tier available)
- A PayPal developer account
- A GitHub account
- (Optional) A SendGrid account for email

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your publishable key and secret key
4. Add them to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

5. Configure webhook for user creation:
   - In Clerk Dashboard, go to Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to `user.created` event
   - Copy the signing secret to `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

## Step 3: Set Up Cloudflare Resources

### Create D1 Database

```bash
npx wrangler d1 create tech-support-db
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "tech-support-db"
database_id = "your-database-id-here"  # Replace with actual ID
```

### Create R2 Bucket

```bash
npx wrangler r2 bucket create tech-support-documents
```

The bucket name is already configured in `wrangler.toml`.

### Initialize Database Schema

First, create the schema file (see next section), then run:

```bash
# Local development database
npx wrangler d1 execute tech-support-db --local --file=./schema.sql

# Production database
npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
```

## Step 4: Configure PayPal

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com)
2. Create a sandbox application
3. Copy your Client ID and Secret
4. Add them to `.env.local`:

```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

5. For production, create a live application and update the credentials

## Step 5: Configure GitHub Integration

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `repo` scope
3. Add it to `.env.local`:

```env
GITHUB_TOKEN=ghp_...
```

## Step 6: Configure Email Service

### Option A: SendGrid

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Verify a sender email address
4. Add to `.env.local`:

```env
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Option B: Cloudflare Email Workers

Follow Cloudflare's documentation for Email Workers setup.

## Step 7: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 8: Test with Cloudflare Workers

To test with actual Cloudflare bindings locally:

```bash
npm run preview
```

This uses Wrangler to run your app with D1 and R2 bindings.

## Step 9: Deploy to Production

### Build for Cloudflare Pages

```bash
npm run pages:build
```

### Deploy

```bash
npm run deploy
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

### Set Production Secrets

```bash
npx wrangler secret put CLERK_SECRET_KEY
npx wrangler secret put CLERK_WEBHOOK_SECRET
npx wrangler secret put PAYPAL_CLIENT_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put SENDGRID_API_KEY
```

### Update Production Database

```bash
npx wrangler d1 execute tech-support-db --remote --file=./schema.sql
```

## Step 10: Configure Webhooks

Update webhook URLs in external services to point to your production domain:

- **Clerk**: `https://your-domain.com/api/webhooks/clerk`
- **PayPal**: `https://your-domain.com/api/webhooks/paypal`
- **GitHub**: `https://your-domain.com/api/webhooks/github`

## Troubleshooting

### Database Connection Issues

Ensure your database ID in `wrangler.toml` matches the one created.

### Authentication Not Working

Verify Clerk keys are correct and webhook is configured.

### PayPal Errors

Make sure you're using sandbox credentials in development and live credentials in production.

### Build Errors

Clear Next.js cache:

```bash
rm -rf .next
npm run build
```

## Next Steps

After setup is complete, proceed to implement the remaining tasks:

1. Set up database schema (Task 2)
2. Implement authentication (Task 3)
3. Build public website pages (Task 4)
4. And so on...

Refer to the [Implementation Tasks](/.kiro/specs/tech-support-client-portal/tasks.md) for the complete roadmap.
