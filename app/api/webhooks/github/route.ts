import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db-utils';

export const runtime = 'edge';

async function verifyGitHubSignature(
  request: Request,
  body: string,
  secret: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying GitHub webhook signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || process.env.GITHUB_TOKEN;
    
    if (!webhookSecret || !await verifyGitHubSignature(request, body, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = request.headers.get('x-github-event');

    if (eventType === 'issues') {
      const { action, issue } = event;
      const ticketIdMatch = issue.body?.match(/\*\*Ticket ID:\*\* ([a-f0-9-]+)/);
      if (!ticketIdMatch) return NextResponse.json({ received: true });

      const ticketId = ticketIdMatch[1];
      const now = new Date().toISOString();

      if (action === 'closed') {
        await execute(
          'UPDATE tickets SET status = $1, updated_at = $2, resolved_at = $3 WHERE id = $4',
          ['closed', now, now, ticketId]
        );
      } else if (action === 'reopened') {
        await execute(
          'UPDATE tickets SET status = $1, updated_at = $2, resolved_at = NULL WHERE id = $3',
          ['open', now, ticketId]
        );
      }

      if (action === 'closed' || action === 'reopened') {
        const commentContent = action === 'closed'
          ? `GitHub issue #${issue.number} was closed. This ticket has been automatically marked as closed.`
          : `GitHub issue #${issue.number} was reopened. This ticket has been automatically reopened.`;

        await execute(
          'INSERT INTO ticket_comments (id, ticket_id, user_id, content, is_internal, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
          [crypto.randomUUID(), ticketId, 'system', commentContent, 1, now]
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET /api/webhooks/github - Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'GitHub webhook endpoint is active'
  });
}
