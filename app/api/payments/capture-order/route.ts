import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { capturePayPalOrder } from "@/lib/paypal";
import { getUserClientId } from "@/lib/auth";
import { handleError, UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { Invoice } from "@/types";
import { sendEmail, getPaymentReceiptEmail } from "@/lib/email";
import { sql } from "@vercel/postgres";

/**
 * POST /api/payments/capture-order
 * Capture a PayPal order and update invoice status
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    // Migrated to Vercel Postgres
    // Get request body
    const body = await request.json();
    const { order_id, invoice_id } = body;

    if (!order_id || !invoice_id) {
      return NextResponse.json(
        { error: "order_id and invoice_id are required" },
        { status: 400 }
      );
    }

    // Get user's client ID
    const clientId = await getUserClientId(userId);

    // Get invoice and verify ownership
    const invoice = await db
      .prepare(`
        SELECT i.*, c.email as client_email, c.name as client_name
        FROM invoices i
        JOIN clients c ON i.client_id = c.id
        WHERE i.id = ?
      `)
      .bind(invoice_id)
      .first<Invoice & { client_email: string; client_name: string }>();

    if (!invoice) {
      throw new NotFoundError("Invoice");
    }

    // Verify invoice belongs to user's client
    if (invoice.client_id !== clientId) {
      throw new ForbiddenError("You don't have access to this invoice");
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Capture the PayPal order
    const capture = await capturePayPalOrder(env, order_id);

    // Extract transaction details
    const transaction = capture.purchase_units[0].payments.captures[0];
    const transactionId = transaction.id;
    const captureStatus = transaction.status;

    // Only update if capture was successful
    if (captureStatus !== 'COMPLETED') {
      return NextResponse.json(
        { error: `Payment capture failed with status: ${captureStatus}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const paymentId = crypto.randomUUID();

    // Update invoice status to paid
    await db
      .prepare(`
        UPDATE invoices
        SET status = 'paid', paid_date = ?, updated_at = ?
        WHERE id = ?
      `)
      .bind(now, now, invoice_id)
      .run();

    // Record payment transaction
    await db
      .prepare(`
        INSERT INTO payments (
          id, invoice_id, client_id, paypal_transaction_id, paypal_order_id,
          amount, currency, status, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        paymentId,
        invoice_id,
        clientId,
        transactionId,
        order_id,
        invoice.total,
        invoice.currency,
        'completed',
        'paypal',
        now
      )
      .run();

    // Send receipt email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const payment = {
        id: paymentId,
        invoice_id,
        client_id: clientId,
        paypal_transaction_id: transactionId,
        paypal_order_id: order_id,
        amount: invoice.total,
        currency: invoice.currency,
        status: 'completed' as const,
        payment_method: 'paypal',
        created_at: now,
      };

      const emailTemplate = getPaymentReceiptEmail(payment, invoice, appUrl);
      await sendEmail(env, invoice.client_email, emailTemplate);
    } catch (emailError) {
      // Log email error but don't fail the payment
      console.error('Failed to send receipt email:', emailError);
    }

    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      transaction_id: transactionId,
      status: 'completed',
    });
  } catch (error) {
    return handleError(error);
  }
}
