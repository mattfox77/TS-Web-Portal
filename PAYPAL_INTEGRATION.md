# PayPal Integration Guide

This document provides information about the PayPal payment integration implemented in the Tech Support Client Portal.

## Overview

The PayPal integration supports:
- One-time invoice payments
- Webhook notifications for payment events
- Subscription billing (foundation for future implementation)

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_WEBHOOK_ID=your_webhook_id_here
```

### Getting PayPal Credentials

1. **Create PayPal App**:
   - Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
   - Navigate to "My Apps & Credentials"
   - Create a new app or use an existing one
   - Copy the Client ID and Secret

2. **Configure Webhook**:
   - In your PayPal app settings, go to "Webhooks"
   - Add webhook URL: `https://your-domain.com/api/webhooks/paypal`
   - Select the following events:
     - `PAYMENT.SALE.COMPLETED`
     - `BILLING.SUBSCRIPTION.ACTIVATED`
     - `BILLING.SUBSCRIPTION.CANCELLED`
     - `BILLING.SUBSCRIPTION.SUSPENDED`
     - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - Copy the Webhook ID

## Implementation Details

### Files Created

1. **lib/paypal.ts** - PayPal API utilities
   - `getPayPalAccessToken()` - OAuth authentication
   - `createPayPalOrder()` - Create payment order
   - `capturePayPalOrder()` - Capture completed payment
   - `verifyPayPalWebhook()` - Verify webhook signatures
   - `paypalRequest()` - Generic API request helper

2. **app/api/payments/create-order/route.ts** - Create PayPal order
   - POST endpoint to initiate payment
   - Validates invoice ownership
   - Returns PayPal approval URL

3. **app/api/payments/capture-order/route.ts** - Capture payment
   - POST endpoint to complete payment
   - Updates invoice status to 'paid'
   - Records payment transaction
   - Sends receipt email

4. **app/api/webhooks/paypal/route.ts** - Webhook handler
   - Verifies webhook signatures
   - Handles payment completion events
   - Handles subscription events
   - Sends email notifications

5. **components/PayPalButton.tsx** - Client-side payment button
   - Initiates PayPal checkout flow
   - Handles redirects to PayPal
   - Shows loading and error states

### Payment Flow

1. **User initiates payment**:
   - User clicks "Pay with PayPal" button on invoice page
   - Frontend calls `/api/payments/create-order`
   - Backend creates PayPal order and returns approval URL
   - User is redirected to PayPal

2. **User completes payment on PayPal**:
   - User logs into PayPal and approves payment
   - PayPal redirects back to invoice page with token

3. **Payment capture**:
   - Frontend calls `/api/payments/capture-order` with token
   - Backend captures the payment
   - Invoice status updated to 'paid'
   - Payment record created in database
   - Receipt email sent to customer

4. **Webhook confirmation** (backup):
   - PayPal sends `PAYMENT.SALE.COMPLETED` webhook
   - Backend verifies signature and processes event
   - Ensures payment is recorded even if capture fails

## Testing

### Sandbox Testing

1. **Use PayPal Sandbox**:
   - Set `PAYPAL_MODE=sandbox`
   - Use sandbox credentials from PayPal Developer Dashboard
   - Create test buyer accounts in sandbox

2. **Test Payment Flow**:
   - Create an invoice as admin
   - Log in as client user
   - Navigate to invoice detail page
   - Click "Pay with PayPal"
   - Use sandbox buyer account to complete payment
   - Verify invoice status changes to 'paid'
   - Check payment record in database

3. **Test Webhook**:
   - Use PayPal's webhook simulator in developer dashboard
   - Send test `PAYMENT.SALE.COMPLETED` event
   - Verify webhook handler processes event correctly

### Production Checklist

- [ ] Update `PAYPAL_MODE` to `live`
- [ ] Use production PayPal credentials
- [ ] Configure production webhook URL
- [ ] Test with real payment (small amount)
- [ ] Verify email notifications work
- [ ] Monitor webhook delivery in PayPal dashboard

## Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT,
  subscription_id TEXT,
  client_id TEXT NOT NULL,
  paypal_transaction_id TEXT UNIQUE,
  paypal_order_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_method TEXT DEFAULT 'paypal',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);
```

## API Endpoints

### POST /api/payments/create-order

Create a PayPal order for invoice payment.

**Request Body**:
```json
{
  "invoice_id": "uuid"
}
```

**Response**:
```json
{
  "order_id": "paypal_order_id",
  "approve_url": "https://paypal.com/checkoutnow?token=..."
}
```

### POST /api/payments/capture-order

Capture a completed PayPal payment.

**Request Body**:
```json
{
  "order_id": "paypal_order_id",
  "invoice_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "payment_id": "uuid",
  "transaction_id": "paypal_transaction_id",
  "status": "completed"
}
```

### POST /api/webhooks/paypal

Handle PayPal webhook events.

**Headers**:
- `paypal-auth-algo`
- `paypal-cert-url`
- `paypal-transmission-id`
- `paypal-transmission-sig`
- `paypal-transmission-time`

**Response**:
```json
{
  "received": true
}
```

## Security

1. **Webhook Verification**:
   - All webhooks are verified using PayPal's signature verification API
   - Invalid signatures are rejected with 401 status

2. **Authorization**:
   - Users can only pay invoices belonging to their client
   - Invoice ownership verified before creating orders

3. **Idempotency**:
   - Duplicate payment webhooks are detected and ignored
   - Prevents double-charging customers

## Error Handling

- PayPal API errors are logged and returned with appropriate status codes
- Email failures don't block payment processing
- Webhook processing errors are logged but return 200 to prevent retries

## Future Enhancements

- Subscription billing (task 11)
- Refund processing
- Payment disputes handling
- Multi-currency support
- Payment analytics dashboard

## Troubleshooting

### Payment not completing

1. Check browser console for errors
2. Verify PayPal credentials are correct
3. Check invoice status in database
4. Review server logs for API errors

### Webhook not received

1. Verify webhook URL is accessible from internet
2. Check webhook configuration in PayPal dashboard
3. Review webhook delivery attempts in PayPal
4. Verify `PAYPAL_WEBHOOK_ID` is correct

### Email not sent

1. Check SendGrid API key is configured
2. Verify sender email is verified in SendGrid
3. Review email sending logs
4. Check spam folder

## Support

For issues or questions:
- Review PayPal API documentation: https://developer.paypal.com/docs/api/
- Check PayPal sandbox logs
- Review application logs in Cloudflare dashboard
