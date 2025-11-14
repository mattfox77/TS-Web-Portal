# Fix Dashboard Error - Complete Guide

## Problem
Users get "Application error: a server-side exception has occurred" when accessing the Client Portal (dashboard).

## Root Cause
When users sign up with Clerk, they're not being automatically added to your PostgreSQL database. The dashboard tries to fetch user data from the database, but the user doesn't exist, causing the error.

## Solution
Configure Clerk webhooks to automatically create database records when users sign up.

---

## Step-by-Step Fix

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://techsupportcomputerservices.com/api/webhooks/clerk
```

### Step 2: Configure Clerk Webhook

1. **Go to Clerk Dashboard**
   - Visit https://dashboard.clerk.com
   - Select your application: "renewing-tahr-75"

2. **Navigate to Webhooks**
   - Click "Webhooks" in the left sidebar
   - Click "Add Endpoint" button

3. **Configure the Webhook**
   - **Endpoint URL**: `https://techsupportcomputerservices.com/api/webhooks/clerk`
   - **Subscribe to events**: Check `user.created`
   - Click "Create"

4. **Copy the Signing Secret**
   - After creating the webhook, you'll see a "Signing Secret"
   - It starts with `whsec_`
   - Copy this secret (you'll need it in the next step)

### Step 3: Add Webhook Secret to Vercel

Run this command in your terminal (replace `YOUR_SIGNING_SECRET` with the actual secret from Clerk):

```bash
npx vercel env add CLERK_WEBHOOK_SECRET
```

When prompted:
- **Value**: Paste your signing secret (starts with `whsec_`)
- **Environments**: Select `Production`, `Preview`, and `Development` (use spacebar to select, enter to confirm)

### Step 4: Redeploy

After adding the environment variable, redeploy your application:

```bash
npx vercel --prod
```

### Step 5: Test the Webhook

1. **Test in Clerk Dashboard**
   - Go back to your webhook in Clerk Dashboard
   - Click "Testing" tab
   - Click "Send Example" for the `user.created` event
   - Should show a successful response (200 OK)

2. **Test with a New User**
   - Go to your site: https://techsupportcomputerservices.com
   - Click "Sign Up"
   - Create a test account
   - After signing up, try accessing the dashboard
   - Should work without errors!

---

## Fix Existing Users

If you already have users who signed up before the webhook was configured, they won't have database records. You have two options:

### Option A: Have them sign up again
- Delete their account in Clerk Dashboard
- Have them sign up again (webhook will create database records)

### Option B: Manually create database records

Run this script to create records for existing Clerk users:

```bash
# First, get the list of Clerk users from the dashboard
# Then run this for each user (replace values):

npx vercel env pull .env.local
```

Then create a script `scripts/create-user-record.js`:

```javascript
const { sql } = require('@vercel/postgres');

async function createUserRecord(clerkUserId, email, firstName, lastName) {
  const clientId = crypto.randomUUID();
  const now = new Date().toISOString();
  const name = `${firstName || ""} ${lastName || ""}`.trim() || email;

  // Create client
  await sql`
    INSERT INTO clients (id, name, email, status, created_at, updated_at)
    VALUES (${clientId}, ${name}, ${email}, 'active', ${now}, ${now})
  `;

  // Create user
  await sql`
    INSERT INTO users (id, client_id, email, first_name, last_name, role, created_at)
    VALUES (${clerkUserId}, ${clientId}, ${email}, ${firstName}, ${lastName}, 'user', ${now})
  `;

  console.log(`Created records for ${email}`);
}

// Example usage:
createUserRecord(
  'user_xxxxxxxxxxxxx', // Clerk user ID
  'user@example.com',
  'John',
  'Doe'
).then(() => process.exit(0));
```

---

## Verification

After completing the setup, verify everything works:

1. **Check Webhook Status**
   ```bash
   # In Clerk Dashboard, check webhook logs
   # Should show successful deliveries
   ```

2. **Check Environment Variable**
   ```bash
   npx vercel env ls | grep CLERK_WEBHOOK
   ```
   Should show `CLERK_WEBHOOK_SECRET` in the list

3. **Test Sign Up Flow**
   - Create a new test account
   - Should be able to access dashboard immediately
   - Dashboard should show user's name and stats

4. **Check Database**
   ```bash
   # Connect to your Neon database and verify:
   SELECT * FROM users WHERE email = 'test@example.com';
   SELECT * FROM clients WHERE email = 'test@example.com';
   ```

---

## Troubleshooting

### Webhook Returns 401 (Invalid Signature)
- Double-check the signing secret is correct
- Make sure you copied the entire secret including `whsec_` prefix
- Redeploy after adding the environment variable

### Webhook Returns 500 (Server Error)
- Check Vercel logs: `npx vercel logs [deployment-url]`
- Verify database connection is working
- Check that all required environment variables are set

### User Still Can't Access Dashboard
- Clear browser cache and cookies
- Sign out and sign back in
- Check if user record exists in database
- Verify Clerk user ID matches database user ID

### Webhook Not Triggering
- Verify webhook URL is correct (no typos)
- Check that `user.created` event is selected
- Test using "Send Example" in Clerk Dashboard
- Check webhook logs in Clerk Dashboard for errors

---

## Current Status

❌ **Not Working:**
- Users can sign up but can't access dashboard
- No database records created for new users
- Missing `CLERK_WEBHOOK_SECRET` environment variable

✅ **After Fix:**
- New users automatically get database records
- Dashboard works immediately after sign up
- Webhook handles user creation automatically

---

## Quick Commands Reference

```bash
# Add webhook secret
npx vercel env add CLERK_WEBHOOK_SECRET

# Redeploy
npx vercel --prod

# Check environment variables
npx vercel env ls

# View logs
npx vercel logs [deployment-url]

# Test webhook endpoint
curl -X POST https://techsupportcomputerservices.com/api/webhooks/clerk
```

---

## Next Steps After Fix

1. Test the complete sign-up flow
2. Verify dashboard loads correctly for new users
3. Consider adding error handling for edge cases
4. Set up monitoring for webhook failures
5. Document the user onboarding process

---

## Important Notes

⚠️ **Security**: Never commit the webhook secret to your repository. Always use environment variables.

⚠️ **Testing**: Use Clerk's test mode for development and testing before going live.

⚠️ **Monitoring**: Regularly check webhook logs in Clerk Dashboard to catch any failures.

💡 **Tip**: You can also handle `user.updated` and `user.deleted` events to keep your database in sync with Clerk.
