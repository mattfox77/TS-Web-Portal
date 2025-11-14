import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { sql } from "@vercel/postgres";

export const runtime = "edge";

/**
 * Clerk webhook handler
 * Handles user.created event to create client and user records in Postgres
 */
export async function POST(request: NextRequest) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await request.text();

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Get the primary email address
    const primaryEmail = email_addresses.find(
      (email: any) => email.id === evt.data.primary_email_address_id
    );

    if (!primaryEmail) {
      console.error("No primary email found for user:", id);
      return NextResponse.json(
        { error: "No primary email found" },
        { status: 400 }
      );
    }

    try {
      // Generate UUIDs for client and user
      const clientId = crypto.randomUUID();
      const now = new Date().toISOString();
      const name = `${first_name || ""} ${last_name || ""}`.trim() || primaryEmail.email_address;

      // Create client record
      await sql`
        INSERT INTO clients (id, name, email, status, created_at, updated_at)
        VALUES (${clientId}, ${name}, ${primaryEmail.email_address}, 'active', ${now}, ${now})
      `;

      // Create user record linked to Clerk user ID
      await sql`
        INSERT INTO users (id, client_id, email, first_name, last_name, role, created_at)
        VALUES (${id}, ${clientId}, ${primaryEmail.email_address}, ${first_name || null}, ${last_name || null}, 'user', ${now})
      `;

      console.log("Created client and user for Clerk user:", id);

      return NextResponse.json({
        success: true,
        client_id: clientId,
        user_id: id,
      });
    } catch (error) {
      console.error("Error creating client/user:", error);
      return NextResponse.json(
        { error: "Failed to create user records" },
        { status: 500 }
      );
    }
  }

  // Return success for other event types
  return NextResponse.json({ received: true });
}
