# Production Environment Variables Setup

This guide provides detailed instructions for obtaining and configuring all required environment variables for production deployment.

## Table of Contents

1. [Clerk Authentication](#clerk-authentication)
2. [PayPal Integration](#paypal-integration)
3. [GitHub Integration](#github-integration)
4. [SendGrid Email Service](#sendgrid-email-service)
5. [Application Configuration](#application-configuration)
6. [Setting Variables in Cloudflare](#setting-variables-in-cloudflare)
7. [Verification](#verification)

---

## Clerk Authentication

Clerk provides authentication and user management for the portal.

### Create Production Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **Create application**
3. Configure:
   - **Application name**: Tech Support Client Portal (Production)
   - **Authentication methods**: 
     - ✅ Email
     - ✅ Google
     - ✅ Microsoft (optional)
   - **Sign-up mode**: Public
4. Click **Create application**

### Get API Keys

1. In your Clerk application dashboard
2. Navigate to **API Keys** in the left sidebar
3. Copy the following values:

```bash
# Publishable Key (starts with pk_live_)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx

# Secret Key (starts with sk_live_)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

### Configure URLs

Set these URLs in Clerk dashboard under **Paths**:

- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`

Add these to environment variables:

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Set Up Webhook

1. In Clerk dashboard, go to **Webhooks**
2. Click **Add Endpoint**
3. Configure:
   - **Endpoint URL**: `https://portal.yourdomain.com/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
4. Click **Create**
5. Copy the **Signing Secret** (starts with `whsec_`)

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Configure Allowed Domains

1. Go to **Domains** in Clerk dashboard
2. Add your production domain: `portal.yourdomain.com`
3. Verify domain ownership if required

### Test Clerk Setup

Before deploying, test in Clerk's development environment:

```bash
# Use test keys locally
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

---

## PayPal Integration

PayPal handles payment processing for invoices and subscriptions.

### Create PayPal Business Account

1. Go to [PayPal Business](https://www.paypal.com/business)
2. Sign up for a business account
3. Complete business verification (required for live payments)

### Access Developer Dashboard

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Log in with your PayPal business account

### Create Live App

1. Click **Apps & Credentials**
2. Switch to **Live** mode (toggle at top)
3. Click **Create App**
4. Configure:
   - **App Name**: Tech Support Client Portal
   - **App Type**: Merchant
5. Click **Create App**

### Get Live Credentials

1. In your app's details page
2. Copy the credentials:

```bash
# Client ID
PAYPAL_CLIENT_ID=AYourLiveClientIDHere

# Client Secret (click "Show" to reveal)
PAYPAL_CLIENT_SECRET=EYourLiveClientSecretHere

# Set mode to live
PAYPAL_MODE=live
```

### Enable Required Features

In your PayPal app settings, enable:

1. **Accept Payments**: ✅ Enabled
2. **Subscriptions**: ✅ Enabled
3. **Invoicing**: ✅ Enabled

### Set Up Webhook

1. In your app's details page
2. Scroll to **Webhooks**
3. Click **Add Webhook**
4. Configure:
   - **Webhook URL**: `https://portal.yourdomain.com/api/webhooks/paypal`
   - **Event types**: Select all of these:
     - ✅ `PAYMENT.SALE.COMPLETED`
     - ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
     - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
     - ✅ `BILLING.SUBSCRIPTION.SUSPENDED`
     - ✅ `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
5. Click **Save**
6. Copy the **Webhook ID**

```bash
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxxxxxxxxxx
```

### Configure Return URLs

In PayPal app settings, add these return URLs:

- **Return URL**: `https://portal.yourdomain.com/dashboard/invoices`
- **Cancel URL**: `https://portal.yourdomain.com/dashboard/invoices`

### Test in Sandbox First

Before going live, test with sandbox credentials:

1. Switch to **Sandbox** mode in PayPal Developer Dashboard
2. Use sandbox credentials:

```bash
PAYPAL_CLIENT_ID=AYourSandboxClientIDHere
PAYPAL_CLIENT_SECRET=EYourSandboxClientSecretHere
PAYPAL_MODE=sandbox
```

3. Create test accounts in **Sandbox** → **Accounts**
4. Test payment flows thoroughly
5. Switch to live credentials only after testing

### Important Notes

- **Live credentials** require business verification
- **Transaction fees**: 2.9% + $0.30 per transaction
- **Payout schedule**: Funds available after 1-3 business days
- **Dispute handling**: Monitor disputes in PayPal dashboard

---

## GitHub Integration

GitHub integration enables automatic issue creation for support tickets.

### Create Personal Access Token

1. Go to GitHub **Settings** → **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Configure:
   - **Note**: Tech Support Portal - Production
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select:
     - ✅ `repo` (for private repositories)
     - OR ✅ `public_repo` (for public repositories only)
5. Click **Generate token**
6. **Important**: Copy the token immediately (you won't see it again)

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

### Alternative: GitHub App (Recommended for Organizations)

For better security and organization-wide access:

1. Go to **Organization Settings** → **Developer settings** → **GitHub Apps**
2. Click **New GitHub App**
3. Configure:
   - **GitHub App name**: Tech Support Portal
   - **Homepage URL**: `https://portal.yourdomain.com`
   - **Webhook URL**: `https://portal.yourdomain.com/api/webhooks/github`
   - **Webhook secret**: Generate a random secret
   - **Permissions**:
     - Repository permissions:
       - Issues: Read & Write
   - **Subscribe to events**:
     - ✅ Issues
4. Click **Create GitHub App**
5. Generate and download private key
6. Install app on repositories

### Set Up Repository Webhooks

For each repository that needs issue tracking:

1. Go to repository **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://portal.yourdomain.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Generate a random secret (store securely)
   - **Events**: Select **Let me select individual events**
     - ✅ Issues
4. Click **Add webhook**

### Store Webhook Secret

If using webhook secret:

```bash
GITHUB_WEBHOOK_SECRET=your_random_secret_here
```

### Token Security Best Practices

1. **Rotate tokens** every 90 days
2. **Use minimal scopes** required
3. **Monitor token usage** in GitHub settings
4. **Revoke immediately** if compromised
5. **Use GitHub App** for organization-wide access

---

## SendGrid Email Service

SendGrid handles transactional emails (notifications, invoices, receipts).

### Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account (100 emails/day)
3. Verify your email address

### Verify Sender Identity

**Option 1: Single Sender Verification** (Easiest)

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in details:
   - **From Name**: Tech Support Computer Services
   - **From Email**: noreply@yourdomain.com
   - **Reply To**: support@yourdomain.com
   - **Company Address**: Your business address
4. Click **Create**
5. Check your email and click verification link

**Option 2: Domain Authentication** (Recommended for production)

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Enter your domain: `yourdomain.com`
4. Add the provided DNS records to your domain
5. Wait for verification (usually 24-48 hours)

### Create API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Configure:
   - **API Key Name**: Tech Support Portal Production
   - **API Key Permissions**: 
     - Select **Restricted Access**
     - Enable only: **Mail Send** → Full Access
4. Click **Create & View**
5. **Important**: Copy the API key immediately

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

### Configure Sender Email

```bash
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Important**: This email must match your verified sender identity.

### Set Up Email Templates (Optional)

For better email design:

1. Go to **Email API** → **Dynamic Templates**
2. Create templates for:
   - Ticket notifications
   - Invoice emails
   - Payment receipts
   - Subscription notifications
3. Copy template IDs for use in code

### Monitor Email Delivery

1. Go to **Activity** to view email delivery status
2. Set up **Alerts** for:
   - Bounce rate > 5%
   - Spam report rate > 0.1%
   - Block rate > 1%

### Alternative: Cloudflare Email Workers

If you prefer Cloudflare's email service:

1. Go to Cloudflare dashboard
2. Navigate to **Email** → **Email Workers**
3. Follow setup instructions
4. Update email sending code to use Cloudflare Email API

---

## Application Configuration

### Application URL

Set your production domain:

```bash
NEXT_PUBLIC_APP_URL=https://portal.yourdomain.com
```

This is used for:
- Generating absolute URLs in emails
- OAuth redirect URLs
- Webhook URLs
- API responses

### Additional Configuration (Optional)

```bash
# Node environment
NODE_ENV=production

# Enable/disable features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true

# Rate limiting (if using Upstash)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## Setting Variables in Cloudflare

### Via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Select **tech-support-client-portal**
4. Click **Settings** → **Environment variables**
5. Select **Production** environment
6. For each variable:
   - Click **Add variable**
   - Enter **Variable name** (exact match required)
   - Enter **Value**
   - Click **Save**
7. After adding all variables, click **Deploy** to apply changes

### Via Wrangler CLI

```bash
# Login to Cloudflare
wrangler login

# Add secrets one by one (for sensitive values)
echo "sk_live_xxxxx" | wrangler pages secret put CLERK_SECRET_KEY \
  --project-name=tech-support-client-portal

echo "your_paypal_secret" | wrangler pages secret put PAYPAL_CLIENT_SECRET \
  --project-name=tech-support-client-portal

echo "SG.xxxxx" | wrangler pages secret put SENDGRID_API_KEY \
  --project-name=tech-support-client-portal

echo "ghp_xxxxx" | wrangler pages secret put GITHUB_TOKEN \
  --project-name=tech-support-client-portal

# Add non-sensitive variables via wrangler.toml [vars] section
```

### Environment Variables Checklist

Copy this checklist and mark off as you add each variable:

#### Clerk Authentication
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- [ ] `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

#### PayPal Integration
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `PAYPAL_MODE`
- [ ] `PAYPAL_WEBHOOK_ID`

#### GitHub Integration
- [ ] `GITHUB_TOKEN`
- [ ] `GITHUB_WEBHOOK_SECRET` (if using)

#### SendGrid Email
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`

#### Application Config
- [ ] `NEXT_PUBLIC_APP_URL`

### Verify Variables Are Set

```bash
# List all environment variables (values hidden)
wrangler pages deployment list --project-name=tech-support-client-portal

# Or check in Cloudflare dashboard
# Settings → Environment variables → Production
```

---

## Verification

### Test Each Integration

After setting all variables, test each integration:

#### 1. Test Clerk Authentication

```bash
# Visit your site
open https://portal.yourdomain.com/sign-in

# Try to:
# - Register new account
# - Login with email
# - Login with Google
# - View dashboard
```

#### 2. Test PayPal Integration

```bash
# Create test invoice as admin
# Try to pay with PayPal
# Verify webhook receives payment notification
# Check invoice status updates to "paid"
```

#### 3. Test GitHub Integration

```bash
# Create support ticket linked to project
# Verify GitHub issue is created
# Close GitHub issue
# Verify ticket status updates
```

#### 4. Test SendGrid Emails

```bash
# Trigger each email type:
# - Create ticket (notification email)
# - Create invoice (invoice email)
# - Complete payment (receipt email)
# - Subscribe to service (subscription email)

# Check SendGrid Activity dashboard for delivery status
```

### Monitor for Errors

```bash
# Stream production logs
wrangler pages deployment tail --project-name=tech-support-client-portal

# Look for:
# - Authentication errors
# - API connection errors
# - Webhook delivery failures
# - Email sending errors
```

### Common Issues

**Issue**: "Invalid API key"
- Verify key is copied correctly (no extra spaces)
- Check key hasn't expired
- Ensure key has correct permissions

**Issue**: "Webhook signature verification failed"
- Verify webhook secret matches
- Check webhook URL is correct
- Ensure HTTPS is used

**Issue**: "Email not sending"
- Verify sender email is verified in SendGrid
- Check API key has Mail Send permission
- Review SendGrid Activity for bounce/block reasons

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different credentials** for development and production
3. **Rotate credentials** regularly:
   - API keys: Every 90 days
   - Webhook secrets: Every 180 days
4. **Monitor usage** of all API keys
5. **Set up alerts** for suspicious activity
6. **Use minimal permissions** for each service
7. **Enable 2FA** on all service accounts
8. **Document credential rotation** procedures
9. **Store backup credentials** securely (password manager)
10. **Revoke immediately** if compromised

---

## Credential Rotation Schedule

Set reminders to rotate credentials:

| Credential | Rotation Frequency | Next Rotation |
|------------|-------------------|---------------|
| Clerk API Keys | 180 days | [Date] |
| PayPal Credentials | 180 days | [Date] |
| GitHub Token | 90 days | [Date] |
| SendGrid API Key | 90 days | [Date] |
| Webhook Secrets | 180 days | [Date] |

---

## Emergency Procedures

### If Credentials Are Compromised

1. **Immediately revoke** the compromised credential
2. **Generate new credential** in the service dashboard
3. **Update environment variable** in Cloudflare
4. **Redeploy application** to apply changes
5. **Monitor logs** for suspicious activity
6. **Review audit logs** in each service
7. **Document incident** for future reference

### Credential Revocation Steps

**Clerk**:
1. Dashboard → API Keys → Revoke key
2. Generate new key
3. Update `CLERK_SECRET_KEY`

**PayPal**:
1. Developer Dashboard → Apps → Reset secret
2. Update `PAYPAL_CLIENT_SECRET`

**GitHub**:
1. Settings → Personal access tokens → Delete token
2. Generate new token
3. Update `GITHUB_TOKEN`

**SendGrid**:
1. Settings → API Keys → Delete key
2. Create new key
3. Update `SENDGRID_API_KEY`

---

## Support Resources

- **Clerk**: [Documentation](https://clerk.com/docs) | [Support](https://clerk.com/support)
- **PayPal**: [Developer Docs](https://developer.paypal.com/docs) | [Support](https://developer.paypal.com/support)
- **GitHub**: [API Docs](https://docs.github.com/en/rest) | [Support](https://support.github.com)
- **SendGrid**: [Documentation](https://docs.sendgrid.com) | [Support](https://support.sendgrid.com)
- **Cloudflare**: [Docs](https://developers.cloudflare.com) | [Community](https://community.cloudflare.com)

---

## Next Steps

After completing environment setup:

1. ✅ Verify all variables are set correctly
2. ✅ Test each integration thoroughly
3. ✅ Set up monitoring and alerts
4. ✅ Document any custom configurations
5. ✅ Train team on credential management
6. ✅ Schedule first credential rotation
