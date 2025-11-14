# Authentication Setup Guide

This document explains how to set up authentication for the Tech Support Client Portal.

## Overview

The portal uses [Clerk](https://clerk.com) for authentication, which provides:
- Email/password authentication
- Social login (Google, Microsoft, etc.)
- User management
- Session handling
- Webhook integration

## Setup Steps

### 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. Create a new application
3. Choose your authentication methods (email/password, Google, etc.)

### 2. Get Your API Keys

From your Clerk dashboard:

1. Go to **API Keys** section
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
   - `CLERK_SECRET_KEY` (starts with `sk_`)

### 3. Configure Environment Variables

Update your `.env.local` file with your Clerk keys:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx  # We'll get this in step 4

# Clerk URLs (already configured)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. Set Up Clerk Webhook

The webhook automatically creates client and user records in the database when a new user signs up.

1. In your Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL:
   - Local development: Use [ngrok](https://ngrok.com) or similar to expose localhost
   - Production: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to the `user.created` event
5. Copy the **Signing Secret** and add it to `.env.local` as `CLERK_WEBHOOK_SECRET`

### 5. Install Dependencies

```bash
npm install
```

This will install:
- `@clerk/nextjs` - Clerk Next.js SDK
- `svix` - Webhook signature verification

### 6. Initialize Database

Make sure your database is set up with the required tables:

```bash
npm run db:init:local
```

### 7. Test Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/sign-up`

3. Create a new account

4. You should be redirected to `/dashboard` after signing up

5. Check your database to verify the client and user records were created

## Authentication Flow

### User Registration

1. User visits `/sign-up` and creates an account with Clerk
2. Clerk sends a webhook to `/api/webhooks/clerk`
3. The webhook handler:
   - Creates a new `client` record
   - Creates a new `user` record linked to the Clerk user ID
   - Sets the default role to `user`
4. User is redirected to `/dashboard`

### User Login

1. User visits `/sign-in` and enters credentials
2. Clerk authenticates the user
3. User is redirected to `/dashboard`
4. The session is maintained by Clerk

### Protected Routes

Routes are protected using Clerk's middleware (`middleware.ts`):

- **Public routes**: `/`, `/sign-in`, `/sign-up`, `/services`, `/about`, `/contact`
- **Protected routes**: `/dashboard/*`, `/admin/*`
- **Webhook routes**: `/api/webhooks/*` (ignored by auth middleware)

### API Authentication

API routes use the `requireAuth()` helper from `lib/auth.ts`:

```typescript
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = await requireAuth();
  // ... rest of the handler
}
```

### Admin Routes

Admin routes use the `requireAdmin()` helper:

```typescript
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { env } = getRequestContext();
  const userId = await requireAdmin(env);
  // ... rest of the handler
}
```

## Helper Functions

### `requireAuth()`

Ensures the user is authenticated. Throws `UnauthorizedError` if not.

```typescript
const userId = await requireAuth();
```

### `requireAdmin(env)`

Ensures the user is authenticated and has admin role. Throws `ForbiddenError` if not admin.

```typescript
const userId = await requireAdmin(env);
```

### `getUserClientId(env, userId)`

Gets the client ID associated with a user.

```typescript
const clientId = await getUserClientId(env, userId);
```

### `hasClientAccess(env, userId, clientId)`

Checks if a user has access to a specific client's data (either owns it or is admin).

```typescript
const hasAccess = await hasClientAccess(env, userId, clientId);
```

## Troubleshooting

### Webhook Not Working

1. Verify the webhook URL is correct and accessible
2. Check the `CLERK_WEBHOOK_SECRET` is set correctly
3. Look at the webhook logs in Clerk dashboard
4. Check your application logs for errors

### User Not Created in Database

1. Verify the database is initialized with the correct schema
2. Check the webhook handler logs
3. Ensure the D1 binding is configured in `wrangler.toml`

### Authentication Not Working

1. Verify all Clerk environment variables are set
2. Clear your browser cookies and try again
3. Check the Clerk dashboard for any issues with your application

## Security Notes

- Never commit `.env.local` to version control
- Keep your `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` secure
- Use different Clerk applications for development and production
- Regularly rotate your API keys

## Next Steps

After authentication is set up:

1. Test user registration and login
2. Verify database records are created
3. Implement the dashboard UI
4. Add role-based access control for admin features
