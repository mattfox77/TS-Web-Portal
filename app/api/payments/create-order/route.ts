import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createPayPalOrder } from "@/lib/paypal";
import { getUserClientId } from "@/lib/auth";
import { handleError, UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { Invoice } from "@/types";
import { sql } from "@vercel/postgres";

/**
 * POST /api/payments/create-order
 * Create a PayPal order for invoice payment
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
    const { invoice_id } = body;

    if (!invoice_id) {
      return NextResponse.json(
        { error: "invoice_id is required" },
        { status: 400 }
      );
    }

    // Get user's client ID
    const clientId = await getUserClientId(userId);

    // Get invoice and verify ownership
    const invoice = await db
      .prepare(`
        SELECT id, invoice_number, client_id, status, total, currency
        FROM invoices
        WHERE id = ?
      `)
      .bind(invoice_id)
      .first<Invoice>();

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

    // Create PayPal order
    const paypalOrder = await createPayPalOrder(env, {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: invoice.total,
      currency: invoice.currency,
      description: `Payment for Invoice ${invoice.invoice_number}`,
    });

    // Find the approval URL
    const approveLink = paypalOrder.links.find(link => link.rel === 'approve');

    if (!approveLink) {
      throw new Error("PayPal approval link not found");
    }

    return NextResponse.json({
      order_id: paypalOrder.id,
      approve_url: approveLink.href,
    });
  } catch (error) {
    return handleError(error);
  }
}
