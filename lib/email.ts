import { sql } from '@vercel/postgres';
import { Env, Ticket, Invoice, Payment, Subscription, NotificationPreferences } from '@/types';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

type NotificationType = 'tickets' | 'invoices' | 'payments' | 'subscriptions';

/**
 * Check if user has enabled notifications for a specific type
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const result = await sql.query(
      'SELECT notification_preferences FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const user = result.rows[0] as { notification_preferences: string | null };
    const preferences: NotificationPreferences = user.notification_preferences
      ? JSON.parse(user.notification_preferences)
      : { tickets: true, invoices: true, payments: true, subscriptions: true };

    return preferences[notificationType] ?? true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to sending notification if there's an error
    return true;
  }
}

export function getTicketCreatedEmail(ticket: Ticket, appUrl: string): EmailTemplate {
  return {
    subject: `New Support Ticket: ${ticket.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .ticket-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Support Ticket Created</h1>
            </div>
            <div class="content">
              <p>Your support ticket has been created successfully. Our team will review it and respond as soon as possible.</p>
              
              <div class="ticket-info">
                <p><strong>Ticket ID:</strong> ${ticket.id}</p>
                <p><strong>Title:</strong> ${ticket.title}</p>
                <p><strong>Priority:</strong> ${ticket.priority.toUpperCase()}</p>
                <p><strong>Status:</strong> ${ticket.status.replace('_', ' ').toUpperCase()}</p>
                ${ticket.description ? `<p><strong>Description:</strong><br>${ticket.description}</p>` : ''}
              </div>
              
              <a href="${appUrl}/dashboard/tickets/${ticket.id}" class="button">View Ticket</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Support Ticket Created

Your support ticket has been created successfully.

Ticket ID: ${ticket.id}
Title: ${ticket.title}
Priority: ${ticket.priority.toUpperCase()}
Status: ${ticket.status.replace('_', ' ').toUpperCase()}
${ticket.description ? `\nDescription:\n${ticket.description}` : ''}

View your ticket: ${appUrl}/dashboard/tickets/${ticket.id}

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getInvoiceEmail(invoice: Invoice, appUrl: string): EmailTemplate {
  return {
    subject: `Invoice ${invoice.invoice_number} from Tech Support Computer Services`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .invoice-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Invoice</h1>
            </div>
            <div class="content">
              <p>You have received a new invoice from Tech Support Computer Services.</p>
              
              <div class="invoice-info">
                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                <p><strong>Amount Due:</strong> $${invoice.total.toFixed(2)} ${invoice.currency}</p>
                <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
              
              <a href="${appUrl}/dashboard/invoices/${invoice.id}" class="button">View Invoice & Pay Online</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `New Invoice

You have received a new invoice from Tech Support Computer Services.

Invoice Number: ${invoice.invoice_number}
Amount Due: $${invoice.total.toFixed(2)} ${invoice.currency}
Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

View and pay online: ${appUrl}/dashboard/invoices/${invoice.id}

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getPaymentReceiptEmail(payment: Payment, invoice: Invoice, appUrl: string): EmailTemplate {
  return {
    subject: `Payment Receipt - Invoice ${invoice.invoice_number}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .payment-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Thank you for your payment! We have received your payment successfully.</p>
              
              <div class="payment-info">
                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                <p><strong>Amount Paid:</strong> $${payment.amount.toFixed(2)} ${payment.currency}</p>
                <p><strong>Payment Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
                <p><strong>Transaction ID:</strong> ${payment.paypal_transaction_id || payment.id}</p>
              </div>
              
              <a href="${appUrl}/dashboard/invoices/${invoice.id}" class="button">View Invoice</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Payment Received

Thank you for your payment!

Invoice Number: ${invoice.invoice_number}
Amount Paid: $${payment.amount.toFixed(2)} ${payment.currency}
Payment Date: ${new Date(payment.created_at).toLocaleDateString()}
Transaction ID: ${payment.paypal_transaction_id || payment.id}

View invoice: ${appUrl}/dashboard/invoices/${invoice.id}

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getSubscriptionActivatedEmail(subscription: Subscription, appUrl: string): EmailTemplate {
  const billingCycle = subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual';
  const nextBillingDate = subscription.next_billing_date 
    ? new Date(subscription.next_billing_date).toLocaleDateString()
    : 'N/A';

  return {
    subject: `Subscription Activated - ${subscription.service_package?.name || 'Service Package'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .subscription-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Activated</h1>
            </div>
            <div class="content">
              <p>Your subscription has been successfully activated! Thank you for choosing Tech Support Computer Services.</p>
              
              <div class="subscription-info">
                <p><strong>Service Package:</strong> ${subscription.service_package?.name || 'N/A'}</p>
                <p><strong>Billing Cycle:</strong> ${billingCycle}</p>
                <p><strong>Start Date:</strong> ${new Date(subscription.start_date).toLocaleDateString()}</p>
                <p><strong>Next Billing Date:</strong> ${nextBillingDate}</p>
              </div>
              
              <p>You can manage your subscription at any time from your dashboard.</p>
              
              <a href="${appUrl}/dashboard/subscriptions" class="button">Manage Subscriptions</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Subscription Activated

Your subscription has been successfully activated!

Service Package: ${subscription.service_package?.name || 'N/A'}
Billing Cycle: ${billingCycle}
Start Date: ${new Date(subscription.start_date).toLocaleDateString()}
Next Billing Date: ${nextBillingDate}

You can manage your subscription at any time from your dashboard.

Manage subscriptions: ${appUrl}/dashboard/subscriptions

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getSubscriptionCancelledEmail(subscription: Subscription, appUrl: string): EmailTemplate {
  return {
    subject: `Subscription Cancelled - ${subscription.service_package?.name || 'Service Package'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .subscription-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Cancelled</h1>
            </div>
            <div class="content">
              <p>Your subscription has been cancelled as requested.</p>
              
              <div class="subscription-info">
                <p><strong>Service Package:</strong> ${subscription.service_package?.name || 'N/A'}</p>
                <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</p>
                ${subscription.next_billing_date ? `<p><strong>Access Until:</strong> ${new Date(subscription.next_billing_date).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p>We're sorry to see you go. If you change your mind, you can resubscribe at any time from your dashboard.</p>
              
              <a href="${appUrl}/dashboard/subscriptions" class="button">View Subscriptions</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Subscription Cancelled

Your subscription has been cancelled as requested.

Service Package: ${subscription.service_package?.name || 'N/A'}
Cancellation Date: ${new Date().toLocaleDateString()}
${subscription.next_billing_date ? `Access Until: ${new Date(subscription.next_billing_date).toLocaleDateString()}` : ''}

We're sorry to see you go. If you change your mind, you can resubscribe at any time.

View subscriptions: ${appUrl}/dashboard/subscriptions

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getSubscriptionRenewalReminderEmail(subscription: Subscription, appUrl: string): EmailTemplate {
  const amount = subscription.billing_cycle === 'monthly' 
    ? subscription.service_package?.price_monthly 
    : subscription.service_package?.price_annual;
  const nextBillingDate = subscription.next_billing_date 
    ? new Date(subscription.next_billing_date).toLocaleDateString()
    : 'N/A';

  return {
    subject: `Subscription Renewal Reminder - ${subscription.service_package?.name || 'Service Package'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .subscription-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Subscription Renewal Reminder</h1>
            </div>
            <div class="content">
              <p>This is a friendly reminder that your subscription will renew in 7 days.</p>
              
              <div class="subscription-info">
                <p><strong>Service Package:</strong> ${subscription.service_package?.name || 'N/A'}</p>
                <p><strong>Renewal Date:</strong> ${nextBillingDate}</p>
                ${amount ? `<p><strong>Amount:</strong> $${amount.toFixed(2)} USD</p>` : ''}
              </div>
              
              <p>Your payment method on file will be charged automatically. If you need to update your payment information or cancel your subscription, please visit your dashboard.</p>
              
              <a href="${appUrl}/dashboard/subscriptions" class="button">Manage Subscription</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Subscription Renewal Reminder

This is a friendly reminder that your subscription will renew in 7 days.

Service Package: ${subscription.service_package?.name || 'N/A'}
Renewal Date: ${nextBillingDate}
${amount ? `Amount: $${amount.toFixed(2)} USD` : ''}

Your payment method on file will be charged automatically. If you need to update your payment information or cancel your subscription, please visit your dashboard.

Manage subscription: ${appUrl}/dashboard/subscriptions

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export function getSubscriptionPaymentFailedEmail(subscription: Subscription, appUrl: string): EmailTemplate {
  return {
    subject: `Payment Failed - ${subscription.service_package?.name || 'Service Package'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .subscription-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ef4444; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <p><strong>Action Required:</strong> We were unable to process your subscription payment.</p>
              
              <div class="subscription-info">
                <p><strong>Service Package:</strong> ${subscription.service_package?.name || 'N/A'}</p>
                <p><strong>Status:</strong> Payment Failed</p>
              </div>
              
              <p>Please update your payment method to avoid service interruption. If you have any questions, please contact our support team.</p>
              
              <a href="${appUrl}/dashboard/subscriptions" class="button">Update Payment Method</a>
            </div>
            <div class="footer">
              <p>Tech Support Computer Services</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Payment Failed

ACTION REQUIRED: We were unable to process your subscription payment.

Service Package: ${subscription.service_package?.name || 'N/A'}
Status: Payment Failed

Please update your payment method to avoid service interruption. If you have any questions, please contact our support team.

Update payment method: ${appUrl}/dashboard/subscriptions

---
Tech Support Computer Services
This is an automated message. Please do not reply to this email.`,
  };
}

export async function sendEmail(
  to: string,
  template: EmailTemplate,
  attachments?: Array<{ filename: string; content: Buffer }>
): Promise<void> {
  try {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@techsupportcs.com';
    
    if (!sendgridApiKey) {
      console.error('SENDGRID_API_KEY environment variable not set');
      return;
    }

    // Using SendGrid as the email provider
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: {
          email: sendgridFromEmail,
          name: 'Tech Support Computer Services',
        },
        subject: template.subject,
        content: [
          { type: 'text/plain', value: template.text },
          { type: 'text/html', value: template.html },
        ],
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: 'application/pdf',
          disposition: 'attachment',
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', response.status, error);
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - email failures shouldn't break the main flow
  }
}
