import { NextRequest, NextResponse } from "next/server";

import { verifyPayPalWebhook, PayPalWebhookEvent } from "@/lib/paypal";
import { sendEmail, getPaymentReceiptEmail, shouldSendNotification, getSubscriptionActivatedEmail, getSubscriptionCancelledEmail, getSubscriptionPaymentFailedEmail } from "@/lib/email";
import { Invoice, Payment } from "@/types";
import { sql } from "@vercel/postgres";

/**
 * POST /api/webhooks/paypal
 * Handle PayPal webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Migrated to Vercel Postgres
    // Get webhook event
    const webhookEvent: PayPalWebhookEvent = await request.json();

    // Get PayPal webhook ID from environment
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook(
      env,
      webhookId,
      {
        authAlgo: request.headers.get('paypal-auth-algo'),
        certUrl: request.headers.get('paypal-cert-url'),
        transmissionId: request.headers.get('paypal-transmission-id'),
        transmissionSig: request.headers.get('paypal-transmission-sig'),
        transmissionTime: request.headers.get('paypal-transmission-time'),
      },
      webhookEvent
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle different event types
    switch (webhookEvent.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentSaleCompleted(db, env, webhookEvent);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        // Handle one-time payment captures (similar to PAYMENT.SALE.COMPLETED)
        await handlePaymentSaleCompleted(db, env, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(db, env, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(db, env, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(db, webhookEvent);
        break;

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(db, env, webhookEvent);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Handle recurring subscription payments
        await handleRecurringPayment(db, env, webhookEvent);
        break;

      default:
        console.log(`Unhandled webhook event type: ${webhookEvent.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle PAYMENT.SALE.COMPLETED event
 * This is triggered when a one-time payment is completed
 */
async function handlePaymentSaleCompleted(
  db: D1Database,
  env: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const sale = event.resource;
  const invoiceId = sale.custom_id || sale.invoice_id;

  if (!invoiceId) {
    console.error('No invoice ID found in payment sale');
    return;
  }

  const now = new Date().toISOString();

  // Check if payment already exists
  const existingPayment = await db
    .prepare('SELECT id FROM payments WHERE paypal_transaction_id = ?')
    .bind(sale.id)
    .first();

  if (existingPayment) {
    console.log('Payment already recorded:', sale.id);
    return;
  }

  // Get invoice details
  const invoice = await db
    .prepare(`
      SELECT i.*, c.email as client_email, c.name as client_name
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `)
    .bind(invoiceId)
    .first<Invoice & { client_email: string; client_name: string }>();

  if (!invoice) {
    console.error('Invoice not found:', invoiceId);
    return;
  }

  // Update invoice status to paid
  await db
    .prepare(`
      UPDATE invoices
      SET status = 'paid', paid_date = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(now, now, invoiceId)
    .run();

  // Record payment transaction
  const paymentId = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO payments (
        id, invoice_id, client_id, paypal_transaction_id,
        amount, currency, status, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      paymentId,
      invoiceId,
      invoice.client_id,
      sale.id,
      parseFloat(sale.amount.total),
      sale.amount.currency,
      'completed',
      'paypal',
      now
    )
    .run();

  // Send receipt email
  try {
    // Get primary user for the client to check notification preferences
    const primaryUser = await db
      .prepare('SELECT id FROM users WHERE client_id = ? LIMIT 1')
      .bind(invoice.client_id)
      .first<{ id: string }>();

    const shouldNotify = primaryUser 
      ? await shouldSendNotification(db, primaryUser.id, 'payments')
      : true;

    if (shouldNotify) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const payment: Payment = {
        id: paymentId,
        invoice_id: invoiceId,
        client_id: invoice.client_id,
        paypal_transaction_id: sale.id,
        amount: parseFloat(sale.amount.total),
        currency: sale.amount.currency,
        status: 'completed',
        payment_method: 'paypal',
        created_at: now,
      };

      const emailTemplate = getPaymentReceiptEmail(payment, invoice, appUrl);
      await sendEmail(env, invoice.client_email, emailTemplate);
    }
  } catch (emailError) {
    console.error('Failed to send receipt email:', emailError);
  }

  console.log('Payment processed successfully:', paymentId);
}

/**
 * Handle BILLING.SUBSCRIPTION.ACTIVATED event
 */
async function handleSubscriptionActivated(
  db: D1Database,
  env: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const subscription = event.resource;
  const now = new Date().toISOString();

  // Update subscription status to active
  await db
    .prepare(`
      UPDATE subscriptions
      SET status = 'active',
          next_billing_date = ?,
          updated_at = ?
      WHERE paypal_subscription_id = ?
    `)
    .bind(
      subscription.billing_info?.next_billing_time || null,
      now,
      subscription.id
    )
    .run();

  // Get subscription details for notification
  const subDetails = await db
    .prepare(`
      SELECT s.*, c.email as client_email, c.name as client_name, sp.name as package_name
      FROM subscriptions s
      JOIN clients c ON s.client_id = c.id
      JOIN service_packages sp ON s.service_package_id = sp.id
      WHERE s.paypal_subscription_id = ?
    `)
    .bind(subscription.id)
    .first<any>();

  if (subDetails) {
    // Send activation confirmation email
    try {
      // Get primary user for the client to check notification preferences
      const primaryUser = await db
        .prepare('SELECT id FROM users WHERE client_id = ? LIMIT 1')
        .bind(subDetails.client_id)
        .first<{ id: string }>();

      const shouldNotify = primaryUser 
        ? await shouldSendNotification(db, primaryUser.id, 'subscriptions')
        : true;

      if (shouldNotify) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const subscriptionData = {
          ...subDetails,
          service_package: {
            name: subDetails.package_name,
          },
        };
        
        const emailTemplate = getSubscriptionActivatedEmail(subscriptionData, appUrl);
        await sendEmail(env, subDetails.client_email, emailTemplate);
      }
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
    }
  }

  console.log('Subscription activated:', subscription.id);
}

/**
 * Handle BILLING.SUBSCRIPTION.CANCELLED event
 */
async function handleSubscriptionCancelled(
  db: D1Database,
  env: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const subscription = event.resource;
  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE subscriptions
      SET status = 'cancelled', updated_at = ?
      WHERE paypal_subscription_id = ?
    `)
    .bind(now, subscription.id)
    .run();

  // Get subscription details for notification
  const subDetails = await db
    .prepare(`
      SELECT s.*, c.email as client_email, c.name as client_name, sp.name as package_name
      FROM subscriptions s
      JOIN clients c ON s.client_id = c.id
      JOIN service_packages sp ON s.service_package_id = sp.id
      WHERE s.paypal_subscription_id = ?
    `)
    .bind(subscription.id)
    .first<any>();

  if (subDetails) {
    try {
      // Get primary user for the client to check notification preferences
      const primaryUser = await db
        .prepare('SELECT id FROM users WHERE client_id = ? LIMIT 1')
        .bind(subDetails.client_id)
        .first<{ id: string }>();

      const shouldNotify = primaryUser 
        ? await shouldSendNotification(db, primaryUser.id, 'subscriptions')
        : true;

      if (shouldNotify) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
        const subscriptionData = {
          ...subDetails,
          service_package: {
            name: subDetails.package_name,
          },
        };
        
        const emailTemplate = getSubscriptionCancelledEmail(subscriptionData, appUrl);
        await sendEmail(env, subDetails.client_email, emailTemplate);
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }
  }

  console.log('Subscription cancelled:', subscription.id);
}

/**
 * Handle BILLING.SUBSCRIPTION.SUSPENDED event
 */
async function handleSubscriptionSuspended(
  db: D1Database,
  event: PayPalWebhookEvent
): Promise<void> {
  const subscription = event.resource;
  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE subscriptions
      SET status = 'suspended', updated_at = ?
      WHERE paypal_subscription_id = ?
    `)
    .bind(now, subscription.id)
    .run();

  console.log('Subscription suspended:', subscription.id);
}

/**
 * Handle BILLING.SUBSCRIPTION.PAYMENT.FAILED event
 */
async function handleSubscriptionPaymentFailed(
  db: D1Database,
  env: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const subscription = event.resource;

  // Get subscription details
  const subDetails = await db
    .prepare(`
      SELECT s.*, c.email as client_email, c.name as client_name, sp.name as package_name
      FROM subscriptions s
      JOIN clients c ON s.client_id = c.id
      JOIN service_packages sp ON s.service_package_id = sp.id
      WHERE s.paypal_subscription_id = ?
    `)
    .bind(subscription.id)
    .first<any>();

  if (!subDetails) {
    console.error('Subscription not found:', subscription.id);
    return;
  }

  // Send notification email about failed payment
  try {
    // Get primary user for the client to check notification preferences
    const primaryUser = await db
      .prepare('SELECT id FROM users WHERE client_id = ? LIMIT 1')
      .bind(subDetails.client_id)
      .first<{ id: string }>();

    const shouldNotify = primaryUser 
      ? await shouldSendNotification(db, primaryUser.id, 'subscriptions')
      : true;

    if (shouldNotify) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const subscriptionData = {
        ...subDetails,
        service_package: {
          name: subDetails.package_name,
        },
      };
      
      const emailTemplate = getSubscriptionPaymentFailedEmail(subscriptionData, appUrl);
      await sendEmail(env, subDetails.client_email, emailTemplate);
    }
  } catch (emailError) {
    console.error('Failed to send payment failed email:', emailError);
  }

  console.log('Subscription payment failed notification sent:', subscription.id);
}

/**
 * Handle recurring subscription payment (PAYMENT.SALE.COMPLETED for subscriptions)
 * Generate invoice for successful recurring payments
 */
async function handleRecurringPayment(
  db: D1Database,
  env: any,
  event: PayPalWebhookEvent
): Promise<void> {
  const sale = event.resource;
  
  // Check if this is a subscription payment (has billing_agreement_id)
  if (!sale.billing_agreement_id) {
    // This is a one-time payment, not a subscription payment
    return;
  }

  const now = new Date().toISOString();

  // Get subscription details
  const subscription = await db
    .prepare(`
      SELECT s.*, c.email as client_email, c.name as client_name, 
             sp.name as package_name, sp.description as package_description,
             sp.price_monthly, sp.price_annual
      FROM subscriptions s
      JOIN clients c ON s.client_id = c.id
      JOIN service_packages sp ON s.service_package_id = sp.id
      WHERE s.paypal_subscription_id = ?
    `)
    .bind(sale.billing_agreement_id)
    .first<any>();

  if (!subscription) {
    console.error('Subscription not found for billing agreement:', sale.billing_agreement_id);
    return;
  }

  // Generate invoice for this recurring payment
  const invoiceId = crypto.randomUUID();
  
  // Generate invoice number (INV-YYYY-NNNN format)
  const year = new Date().getFullYear();
  const countResult = await db
    .prepare('SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?')
    .bind(`INV-${year}-%`)
    .first<{ count: number }>();
  
  const invoiceNumber = `INV-${year}-${String((countResult?.count || 0) + 1).padStart(4, '0')}`;

  // Calculate amounts
  const amount = parseFloat(sale.amount.total);
  const taxRate = 0; // Adjust based on your tax requirements
  const taxAmount = amount * taxRate;
  const subtotal = amount - taxAmount;

  // Create invoice
  await db
    .prepare(`
      INSERT INTO invoices (
        id, invoice_number, client_id, status, subtotal, tax_rate, 
        tax_amount, total, currency, issue_date, due_date, paid_date,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      invoiceId,
      invoiceNumber,
      subscription.client_id,
      'paid',
      subtotal,
      taxRate,
      taxAmount,
      amount,
      sale.amount.currency,
      now,
      now, // Due date same as issue date since it's already paid
      now, // Paid immediately
      `Subscription payment for ${subscription.package_name} (${subscription.billing_cycle})`,
      now,
      now
    )
    .run();

  // Create invoice line item
  const itemId = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO invoice_items (
        id, invoice_id, description, quantity, unit_price, amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      itemId,
      invoiceId,
      `${subscription.package_name} - ${subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)} Subscription`,
      1,
      subtotal,
      subtotal,
      now
    )
    .run();

  // Record payment
  const paymentId = crypto.randomUUID();
  await db
    .prepare(`
      INSERT INTO payments (
        id, invoice_id, subscription_id, client_id, paypal_transaction_id,
        amount, currency, status, payment_method, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      paymentId,
      invoiceId,
      subscription.id,
      subscription.client_id,
      sale.id,
      amount,
      sale.amount.currency,
      'completed',
      'paypal',
      now
    )
    .run();

  // Send invoice/receipt email
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailTemplate = {
      subject: `Invoice ${invoiceNumber} - Subscription Payment Receipt`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9fafb; padding: 20px; }
              .invoice-details { background-color: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 8px 0; }
              .label { color: #6b7280; }
              .value { font-weight: 600; text-align: right; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Payment Received</h1>
              </div>
              <div class="content">
                <p>Hello ${subscription.client_name},</p>
                <p>Thank you for your subscription payment. Here are the details:</p>
                <div class="invoice-details">
                  <table>
                    <tr>
                      <td class="label">Invoice Number:</td>
                      <td class="value">${invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td class="label">Service:</td>
                      <td class="value">${subscription.package_name}</td>
                    </tr>
                    <tr>
                      <td class="label">Billing Cycle:</td>
                      <td class="value">${subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}</td>
                    </tr>
                    <tr>
                      <td class="label">Amount Paid:</td>
                      <td class="value">$${amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td class="label">Payment Date:</td>
                      <td class="value">${new Date(now).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td class="label">Transaction ID:</td>
                      <td class="value">${sale.id}</td>
                    </tr>
                  </table>
                </div>
                <p>You can view your invoice and payment history in your dashboard.</p>
                <a href="${appUrl}/dashboard/invoices/${invoiceId}" class="button">View Invoice</a>
              </div>
              <div class="footer">
                <p>Tech Support Computer Services</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Payment Received\n\nInvoice Number: ${invoiceNumber}\nService: ${subscription.package_name}\nBilling Cycle: ${subscription.billing_cycle}\nAmount Paid: $${amount.toFixed(2)}\nPayment Date: ${new Date(now).toLocaleDateString()}\nTransaction ID: ${sale.id}\n\nView invoice: ${appUrl}/dashboard/invoices/${invoiceId}`,
    };

    await sendEmail(env, subscription.client_email, emailTemplate);
  } catch (emailError) {
    console.error('Failed to send invoice email:', emailError);
  }

  console.log('Recurring payment processed and invoice generated:', invoiceNumber);
}
