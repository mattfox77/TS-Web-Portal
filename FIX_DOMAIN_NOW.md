# Fix techsupportcomputerservices.com - Quick Guide

## Current Status
✅ Domain configured: techsupportcomputerservices.com
✅ Deployment live: Site is deployed
✅ Database ready: Postgres schema loaded
❌ Site showing 500 error: Missing Clerk authentication keys

## Fix in 3 Steps

### Step 1: Get Your Clerk Keys
1. Go to https://dashboard.clerk.com
2. Select your application (or create one)
3. Go to "API Keys"
4. Copy these two keys:
   - `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)

### Step 2: Add Keys to Vercel
Run these commands (replace with your actual keys):

```bash
# Add secret key
npx vercel env add CLERK_SECRET_KEY production
# Paste your sk_test_... key when prompted

# Add publishable key  
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# Paste your pk_test_... key when prompted

# Add these URL configs
npx vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
# Enter: /sign-in

npx vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production
# Enter: /sign-up

npx vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL production
# Enter: /dashboard

npx vercel env add NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL production
# Enter: /dashboard
```

### Step 3: Redeploy
```bash
npx vercel --prod
```

## Alternative: Use Vercel Dashboard

1. Go to: https://vercel.com/matt-foxs-projects/ts-web-portal/settings/environment-variables
2. Click "Add New"
3. Add each variable:
   - Name: `CLERK_SECRET_KEY`
   - Value: Your `sk_test_...` key
   - Environment: Production
4. Repeat for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Add the URL configs (values shown above)
6. Redeploy from dashboard or run `npx vercel --prod`

## After Adding Keys

Your site at https://techsupportcomputerservices.com will work!

You'll be able to:
- Sign up / Sign in
- Create projects
- Create tickets
- View dashboard
- All features working

## That's It!

Once you add those Clerk keys and redeploy, your site will be fully functional on your custom domain.
