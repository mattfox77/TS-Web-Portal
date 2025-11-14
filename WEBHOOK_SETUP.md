# Webhook Configuration Guide

This guide provides detailed instructions for configuring webhooks in all external services (Clerk, PayPal, GitHub).

## Table of Contents

1. [Overview](#overview)
2. [Clerk Webhook](#clerk-webhook)
3. [PayPal Webhook](#paypal-webhook)
4. [GitHub Webhook](#github-webhook)
5. [Testing Webhooks](#testing-webhooks)
6. [Troubleshooting](#troubleshooting)
7. [Security](#security)

---

## Overview

Webhooks enable real-time communication between external services and your application. The portal uses webhooks for:

- **Clerk**: User creation, updates, and deletion
- **PayPal**: Payment completion and subscription events
- **GitHub**: Issue status changes for ticket tracking

### Webhook URLs

All webhook URLs follow this pattern:
```
https://portal.yourdomain.com/api/webhooks/{service}
```

**Production URLs**:
- Clerk: `https://portal.yourdomain.com/api/webhooks/clerk`
- PayPal: `https://portal.yourdomain.com/api/webhooks/paypal`
- GitHub: `https://portal.yourdomain.com/api/webhooks/github`

**Important**: Replace `portal.yourdomain.com` with your actual domain.

---

## Clerk Webhook

Clerk webhooks sync user data between Clerk and your database.

### Step 1: Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **production** application
3. Navigate to **Webhooks** in the left sidebar

### Step 2: Add Webhook Endpoint

1. Click **Add Endpoint**
2. Configure the endpoint:

**Endpoint URL**:
```
https://portal.yourdomain.com/api/webhooks/clerk
```

**Subscribe to events**:
- ✅ `user.created` - When a new user registers
- ✅ `user.updated` - When user profile is updated
- ✅ `user.deleted` - When a user is deleted

**Optional events** (if needed):
- `session.created` - Track user sessions
- `session.ended` - Track session endings
- `organization.created` - If using organizations

3. Click **Create**

### Step 3: Copy Signing Secret

1. After creating the endpoint, you'll see the **Signing Secret**
2. Copy the secret (starts with `whsec_`)
3. Add it to your environment variables:

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Update Environment Variables

In Cloudflare Pages:
1. Go to **Workers & Pages** → Select project
2. Click **Settings** → **Environment variables**
3. Add or update `CLERK_WEBHOOK_SECRET`
4. Click **Save** and redeploy

### Step 5: Test Webhook

1. In Clerk dashboard, go to your webhook endpoint
2. Click **Send test event**
3. Select `user.created` event
4. Click **Send**
5. Check the **Attempts** tab for delivery status

Expected response: `200 OK`

### Webhook Payload Example

```json
{
  "data": {
    "id": "user_xxxxxxxxxxxxxxxxxxxxx",
    "email_addresses": [
      {
        "email_address": "user@example.com",
        "id": "idn_xxxxxxxxxxxxxxxxxxxxx"
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "created_at": 1234567890000,
    "updated_at": 1234567890000
  },
  "object": "event",
  "type": "user.created"
}
```

### What Happens

When a user registers:
1. Clerk sends `user.created` webhook
2. Portal creates `clients` record
3. Portal creates `users` record with Clerk user ID
4. User can now access the portal

---

## PayPal Webhook

PayPal webhooks handle payment notifications and subscription events.

### Step 1: Access PayPal Developer Dashboard

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Log in with your PayPal business account
3. Navigate to **Apps & Credentials**
4. Switch to **Live** mode (toggle at top)
5. Select your application

### Step 2: Add Webhook

1. Scroll down to **Webhooks** section
2. Click **Add Webhook**
3. Configure the webhook:

**Webhook URL**:
```
https://portal.yourdomain.com/api/webhooks/paypal
```

**Event types** - Select these events:

**Payment Events**:
- ✅ `PAYMENT.SALE.COMPLETED` - One-time payment completed
- ✅ `PAYMENT.SALE.REFUNDED` - Payment refunded
- ✅ `PAYMENT.SALE.REVERSED` - Payment reversed

**Subscription Events**:
- ✅ `BILLING.SUBSCRIPTION.ACTIVATED` - Subscription activated
- ✅ `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- ✅ `BILLING.SUBSCRIPTION.SUSPENDED` - Subscription suspended
- ✅ `BILLING.SUBSCRIPTION.PAYMENT.FAILED` - Recurring payment failed
- ✅ `BILLING.SUBSCRIPTION.UPDATED` - Subscription updated

4. Click **Save**

### Step 3: Copy Webhook ID

1. After creating the webhook, you'll see the **Webhook ID**
2. Copy the ID (starts with `WH-`)
3. Add it to your environment variables:

```bash
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Update Environment Variables

In Cloudflare Pages:
1. Go to **Workers & Pages** → Select project
2. Click **Settings** → **Environment variables**
3. Add or update `PAYPAL_WEBHOOK_ID`
4. Ensure `PAYPAL_MODE=live` for production
5. Click **Save** and redeploy

### Step 5: Test Webhook

#### Using PayPal Sandbox

1. Switch to **Sandbox** mode in PayPal dashboard
2. Create a sandbox webhook with same events
3. Use sandbox credentials in development
4. Test payment flow with sandbox accounts

#### Using PayPal Webhook Simulator

1. In PayPal dashboard, go to your webhook
2. Click **Webhook simulator**
3. Select event type (e.g., `PAYMENT.SALE.COMPLETED`)
4. Click **Send**
5. Check delivery status

### Webhook Payload Example

**Payment Completed**:
```json
{
  "id": "WH-xxxxxxxxxxxxxxxxxxxxx",
  "event_version": "1.0",
  "create_time": "2024-01-01T12:00:00Z",
  "resource_type": "sale",
  "event_type": "PAYMENT.SALE.COMPLETED",
  "summary": "Payment completed for $100.00 USD",
  "resource": {
    "id": "SALE-xxxxxxxxxxxxxxxxxxxxx",
    "state": "completed",
    "amount": {
      "total": "100.00",
      "currency": "USD"
    },
    "payment_mode": "INSTANT_TRANSFER",
    "create_time": "2024-01-01T12:00:00Z",
    "update_time": "2024-01-01T12:00:00Z"
  }
}
```

### What Happens

When a payment is completed:
1. PayPal sends `PAYMENT.SALE.COMPLETED` webhook
2. Portal verifies webhook signature
3. Portal updates invoice status to "paid"
4. Portal records payment transaction
5. Portal sends receipt email to customer

---

## GitHub Webhook

GitHub webhooks sync issue status with support tickets.

### Prerequisites

- GitHub repository for project tracking
- GitHub personal access token or GitHub App

### Step 1: Access Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks**
3. Click **Add webhook**

### Step 2: Configure Webhook

**Payload URL**:
```
https://portal.yourdomain.com/api/webhooks/github
```

**Content type**:
```
application/json
```

**Secret** (optional but recommended):
```
Generate a random secret and store it securely
```

To generate a secret:
```bash
openssl rand -hex 32
```

Add to environment variables:
```bash
GITHUB_WEBHOOK_SECRET=your_generated_secret
```

**Which events would you like to trigger this webhook?**:
- Select **Let me select individual events**
- ✅ **Issues** (issue opened, closed, reopened, etc.)
- Uncheck all other events

**Active**:
- ✅ Checked

4. Click **Add webhook**

### Step 3: Verify Webhook

1. After creating, GitHub will send a ping event
2. Check the **Recent Deliveries** tab
3. Look for the ping event with `200 OK` response

### Step 4: Test Webhook

1. Create a test issue in the repository
2. Close the issue
3. Check Recent Deliveries for the events
4. Verify ticket status updated in portal

### Webhook Payload Example

**Issue Closed**:
```json
{
  "action": "closed",
  "issue": {
    "id": 123456789,
    "number": 42,
    "title": "Support Ticket: Login Issue",
    "state": "closed",
    "body": "Ticket ID: ticket_xxxxx\n\nUser reported login issues...",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T13:00:00Z",
    "closed_at": "2024-01-01T13:00:00Z"
  },
  "repository": {
    "id": 987654321,
    "name": "client-project",
    "full_name": "techsupport/client-project"
  }
}
```

### What Happens

When a GitHub issue is closed:
1. GitHub sends `issues` webhook with `action: closed`
2. Portal extracts ticket ID from issue body
3. Portal updates ticket status to "closed"
4. Portal sends notification to ticket creator

### Multiple Repositories

To track issues across multiple repositories:

1. Add webhook to each repository
2. Use the same webhook URL
3. Portal will handle issues from all repositories
4. Ensure each project has correct `github_repo` field

---

## Testing Webhooks

### Test Checklist

#### Clerk Webhook
- [ ] User registration creates client and user records
- [ ] User profile update syncs to database
- [ ] User deletion removes records (or marks inactive)
- [ ] Webhook signature verification works
- [ ] Error handling works for invalid payloads

#### PayPal Webhook
- [ ] Payment completion updates invoice status
- [ ] Payment records transaction in database
- [ ] Receipt email sent to customer
- [ ] Subscription activation updates status
- [ ] Subscription cancellation updates status
- [ ] Webhook signature verification works

#### GitHub Webhook
- [ ] Issue creation doesn't affect existing tickets
- [ ] Issue closure updates ticket status
- [ ] Issue reopening updates ticket status
- [ ] Ticket ID extraction works correctly
- [ ] Webhook signature verification works (if enabled)

### Manual Testing

#### Test Clerk Webhook

```bash
# Send test webhook using curl
curl -X POST https://portal.yourdomain.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_xxxxx" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,xxxxx" \
  -d '{
    "data": {
      "id": "user_test123",
      "email_addresses": [{"email_address": "test@example.com"}],
      "first_name": "Test",
      "last_name": "User"
    },
    "type": "user.created"
  }'
```

#### Test PayPal Webhook

Use PayPal's webhook simulator in the developer dashboard.

#### Test GitHub Webhook

```bash
# Send test webhook using curl
curl -X POST https://portal.yourdomain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-Hub-Signature-256: sha256=xxxxx" \
  -d '{
    "action": "closed",
    "issue": {
      "number": 42,
      "title": "Test Issue",
      "body": "Ticket ID: ticket_test123",
      "state": "closed"
    }
  }'
```

### Monitor Webhook Delivery

#### View Logs

```bash
# Stream production logs
wrangler pages deployment tail --project-name=tech-support-client-portal

# Filter for webhook events
wrangler pages deployment tail --project-name=tech-support-client-portal \
  | grep "webhook"
```

#### Check Service Dashboards

**Clerk**:
1. Go to webhook endpoint in Clerk dashboard
2. Click **Attempts** tab
3. View delivery status and responses

**PayPal**:
1. Go to webhook in PayPal dashboard
2. Click **Webhook events**
3. View recent events and delivery status

**GitHub**:
1. Go to repository **Settings** → **Webhooks**
2. Click on your webhook
3. View **Recent Deliveries**
4. Click on individual deliveries to see request/response

---

## Troubleshooting

### Common Issues

#### Webhook Returns 401 Unauthorized

**Cause**: Invalid or missing webhook secret

**Solution**:
1. Verify webhook secret is set in environment variables
2. Check secret matches the one in service dashboard
3. Redeploy application after updating secrets

```bash
# Verify environment variable is set
wrangler pages deployment list --project-name=tech-support-client-portal
```

#### Webhook Returns 500 Internal Server Error

**Cause**: Application error processing webhook

**Solution**:
1. Check application logs for error details
2. Verify database connection
3. Check payload format matches expected structure

```bash
# View error logs
wrangler pages deployment tail --project-name=tech-support-client-portal
```

#### Webhook Not Receiving Events

**Cause**: Incorrect URL or service configuration

**Solution**:
1. Verify webhook URL is correct
2. Check webhook is active in service dashboard
3. Ensure application is deployed and accessible
4. Test URL manually with curl

```bash
# Test webhook endpoint
curl -I https://portal.yourdomain.com/api/webhooks/clerk
```

#### Signature Verification Fails

**Cause**: Incorrect secret or signature algorithm

**Solution**:
1. Verify webhook secret matches
2. Check signature verification code
3. Ensure timestamp is within acceptable range
4. Review service documentation for signature format

### Debugging Tips

1. **Enable verbose logging** in webhook handlers
2. **Log raw payloads** to see exact data received
3. **Test with webhook simulators** before live events
4. **Monitor delivery attempts** in service dashboards
5. **Set up alerts** for webhook failures

### Webhook Handler Code Review

Check these files for webhook implementation:
- `app/api/webhooks/clerk/route.ts`
- `app/api/webhooks/paypal/route.ts`
- `app/api/webhooks/github/route.ts`

Verify:
- Signature verification is implemented
- Error handling is comprehensive
- Database operations are wrapped in try-catch
- Responses are returned correctly

---

## Security

### Best Practices

1. **Always verify signatures** - Never trust webhook payloads without verification
2. **Use HTTPS only** - Webhooks should only be sent over HTTPS
3. **Validate payload structure** - Check all required fields exist
4. **Implement idempotency** - Handle duplicate webhook deliveries
5. **Rate limit webhooks** - Protect against webhook flooding
6. **Log all webhooks** - Keep audit trail of all webhook events
7. **Rotate secrets regularly** - Change webhook secrets every 6 months
8. **Monitor for anomalies** - Alert on unusual webhook patterns

### Signature Verification

#### Clerk (Svix)

```typescript
import { Webhook } from 'svix';

const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
const payload = await request.text();
const headers = {
  'svix-id': request.headers.get('svix-id')!,
  'svix-timestamp': request.headers.get('svix-timestamp')!,
  'svix-signature': request.headers.get('svix-signature')!,
};

try {
  const event = webhook.verify(payload, headers);
  // Process event
} catch (err) {
  return new Response('Invalid signature', { status: 401 });
}
```

#### PayPal

```typescript
import crypto from 'crypto';

async function verifyPayPalWebhook(
  request: Request,
  webhookId: string
): Promise<boolean> {
  const body = await request.text();
  const headers = {
    'paypal-auth-algo': request.headers.get('paypal-auth-algo'),
    'paypal-cert-url': request.headers.get('paypal-cert-url'),
    'paypal-transmission-id': request.headers.get('paypal-transmission-id'),
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig'),
    'paypal-transmission-time': request.headers.get('paypal-transmission-time'),
  };

  // Verify with PayPal API
  const response = await fetch(
    `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
        ...headers,
      }),
    }
  );

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}
```

#### GitHub

```typescript
import crypto from 'crypto';

function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

const signature = request.headers.get('x-hub-signature-256');
const payload = await request.text();
const isValid = verifyGitHubSignature(
  payload,
  signature,
  process.env.GITHUB_WEBHOOK_SECRET!
);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}
```

### Webhook Secrets Management

1. **Store in environment variables** - Never hardcode secrets
2. **Use different secrets** for development and production
3. **Rotate regularly** - Change secrets every 6 months
4. **Document rotation process** - Keep procedures up to date
5. **Revoke immediately** if compromised

### Monitoring and Alerts

Set up alerts for:
- Webhook signature verification failures
- High rate of webhook errors
- Unusual webhook patterns
- Missing expected webhooks

---

## Webhook Configuration Checklist

Use this checklist to ensure all webhooks are properly configured:

### Clerk Webhook
- [ ] Webhook endpoint created in Clerk dashboard
- [ ] Webhook URL set to production domain
- [ ] Events selected: `user.created`, `user.updated`, `user.deleted`
- [ ] Signing secret copied and added to environment variables
- [ ] Test webhook sent successfully
- [ ] User registration tested end-to-end

### PayPal Webhook
- [ ] Webhook created in PayPal Live app
- [ ] Webhook URL set to production domain
- [ ] All payment and subscription events selected
- [ ] Webhook ID copied and added to environment variables
- [ ] Test webhook sent successfully (via simulator)
- [ ] Payment flow tested end-to-end

### GitHub Webhook
- [ ] Webhook added to repository/repositories
- [ ] Webhook URL set to production domain
- [ ] Content type set to `application/json`
- [ ] Secret generated and added to environment variables
- [ ] Issues event selected
- [ ] Webhook active and verified
- [ ] Issue closure tested with ticket update

### General
- [ ] All webhook secrets stored securely
- [ ] Environment variables updated in Cloudflare
- [ ] Application redeployed after adding secrets
- [ ] Webhook logs monitored for errors
- [ ] Documentation updated with webhook URLs
- [ ] Team trained on webhook monitoring

---

## Support Resources

- **Clerk Webhooks**: [Documentation](https://clerk.com/docs/integrations/webhooks)
- **PayPal Webhooks**: [Documentation](https://developer.paypal.com/docs/api-basics/notifications/webhooks)
- **GitHub Webhooks**: [Documentation](https://docs.github.com/en/webhooks)
- **Svix (Clerk)**: [Documentation](https://docs.svix.com)

---

## Next Steps

After configuring webhooks:

1. ✅ Test each webhook thoroughly
2. ✅ Monitor webhook delivery for 24 hours
3. ✅ Set up alerts for webhook failures
4. ✅ Document any custom webhook handlers
5. ✅ Train team on webhook monitoring
6. ✅ Schedule webhook secret rotation
