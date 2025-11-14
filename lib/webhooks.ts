import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Verify PayPal webhook signature
 * 
 * @param request - NextRequest instance
 * @param webhookId - PayPal webhook ID from environment
 * @param accessToken - PayPal access token
 * @param apiBase - PayPal API base URL
 * @returns true if signature is valid, false otherwise
 */
export async function verifyPayPalWebhook(
  request: NextRequest,
  webhookId: string,
  accessToken: string,
  apiBase: string
): Promise<boolean> {
  try {
    const body = await request.text();
    
    // Get PayPal webhook headers
    const headers = {
      'auth-algo': request.headers.get('paypal-auth-algo'),
      'cert-url': request.headers.get('paypal-cert-url'),
      'transmission-id': request.headers.get('paypal-transmission-id'),
      'transmission-sig': request.headers.get('paypal-transmission-sig'),
      'transmission-time': request.headers.get('paypal-transmission-time'),
    };
    
    // Check if all required headers are present
    if (!headers['auth-algo'] || !headers['cert-url'] || !headers['transmission-id'] || 
        !headers['transmission-sig'] || !headers['transmission-time']) {
      console.error('Missing PayPal webhook headers');
      return false;
    }
    
    // Verify signature with PayPal API
    const response = await fetch(
      `${apiBase}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          webhook_id: webhookId,
          webhook_event: JSON.parse(body),
          auth_algo: headers['auth-algo'],
          cert_url: headers['cert-url'],
          transmission_id: headers['transmission-id'],
          transmission_sig: headers['transmission-sig'],
          transmission_time: headers['transmission-time'],
        }),
      }
    );
    
    if (!response.ok) {
      console.error('PayPal signature verification failed:', await response.text());
      return false;
    }
    
    const result = await response.json();
    return result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

/**
 * Verify GitHub webhook signature
 * 
 * @param request - NextRequest instance
 * @param secret - GitHub webhook secret from environment
 * @param body - Request body as string
 * @returns true if signature is valid, false otherwise
 */
export async function verifyGitHubWebhook(
  request: NextRequest,
  secret: string,
  body: string
): Promise<boolean> {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    
    if (!signature) {
      console.error('Missing GitHub signature header');
      return false;
    }
    
    // GitHub uses HMAC SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying GitHub webhook:', error);
    return false;
  }
}

/**
 * Verify Clerk webhook signature using Svix
 * 
 * @param request - NextRequest instance
 * @param secret - Clerk webhook secret from environment
 * @param body - Request body as string
 * @returns true if signature is valid, false otherwise
 */
export async function verifyClerkWebhook(
  request: NextRequest,
  secret: string,
  body: string
): Promise<boolean> {
  try {
    // Get Svix headers
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');
    
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Clerk/Svix webhook headers');
      return false;
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const timestamp = parseInt(svixTimestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      console.error('Clerk webhook timestamp too old');
      return false;
    }
    
    // Construct the signed content
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;
    
    // Get the secret (remove 'whsec_' prefix if present)
    const secretBytes = secret.startsWith('whsec_') 
      ? Buffer.from(secret.slice(6), 'base64')
      : Buffer.from(secret);
    
    // Compute expected signature
    const hmac = crypto.createHmac('sha256', secretBytes);
    hmac.update(signedContent);
    const expectedSignature = hmac.digest('base64');
    
    // Parse signatures from header (format: "v1,signature1 v1,signature2")
    const signatures = svixSignature.split(' ').map(sig => {
      const parts = sig.split(',');
      return parts.length === 2 ? parts[1] : null;
    }).filter(Boolean);
    
    // Check if any signature matches
    for (const sig of signatures) {
      try {
        if (crypto.timingSafeEqual(
          Buffer.from(sig as string),
          Buffer.from(expectedSignature)
        )) {
          return true;
        }
      } catch {
        // Continue to next signature
      }
    }
    
    console.error('Clerk webhook signature verification failed');
    return false;
  } catch (error) {
    console.error('Error verifying Clerk webhook:', error);
    return false;
  }
}

/**
 * Generic HMAC signature verification
 * 
 * @param body - Request body as string
 * @param signature - Signature from header
 * @param secret - Webhook secret
 * @param algorithm - Hash algorithm (default: sha256)
 * @returns true if signature is valid, false otherwise
 */
export function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    
    // Remove any prefix (e.g., "sha256=")
    const cleanSignature = signature.includes('=') 
      ? signature.split('=')[1] 
      : signature;
    
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying HMAC signature:', error);
    return false;
  }
}

/**
 * Extract and cache request body for signature verification
 * This is needed because request.text() can only be called once
 * 
 * @param request - NextRequest instance
 * @returns Request body as string
 */
export async function getRequestBody(request: NextRequest): Promise<string> {
  try {
    return await request.text();
  } catch (error) {
    console.error('Error reading request body:', error);
    return '';
  }
}
