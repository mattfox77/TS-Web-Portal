import { NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Activity log entry data
 */
export interface ActivityLogData {
  user_id?: string;
  client_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
}

/**
 * Log an activity to the activity_log table
 * 
 * @param data - Activity log data
 */
export async function logActivity(
  data: ActivityLogData
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    
    await sql.query(
      `INSERT INTO activity_log 
        (id, user_id, client_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.user_id || null,
        data.client_id || null,
        data.action,
        data.entity_type || null,
        data.entity_id || null,
        data.details ? JSON.stringify(data.details) : null,
        data.ip_address || null,
        new Date().toISOString()
      ]
    );
  } catch (error) {
    // Log errors but don't throw - audit logging should not break the main flow
    console.error('Failed to log activity:', error);
  }
}

/**
 * Extract IP address from request
 * 
 * @param request - NextRequest instance
 * @returns IP address or undefined
 */
export function getIpAddress(request: NextRequest): string | undefined {
  // Check Cloudflare headers first
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to other common headers
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  return undefined;
}

/**
 * Log authentication attempt
 */
export async function logAuthAttempt(
  request: NextRequest,
  userId: string | null,
  success: boolean,
  details?: Record<string, any>
): Promise<void> {
  await logActivity({
    user_id: userId || undefined,
    action: success ? 'auth_success' : 'auth_failed',
    entity_type: 'auth',
    details: {
      success,
      ...details,
    },
    ip_address: getIpAddress(request),
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  request: NextRequest,
  adminUserId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logActivity({
    user_id: adminUserId,
    action: `admin_${action}`,
    entity_type: entityType,
    entity_id: entityId,
    details,
    ip_address: getIpAddress(request),
  });
}

/**
 * Log invoice creation
 */
export async function logInvoiceCreated(
  request: NextRequest,
  adminUserId: string,
  clientId: string,
  invoiceId: string,
  invoiceNumber: string,
  total: number
): Promise<void> {
  await logActivity({
    user_id: adminUserId,
    client_id: clientId,
    action: 'invoice_created',
    entity_type: 'invoice',
    entity_id: invoiceId,
    details: {
      invoice_number: invoiceNumber,
      total,
    },
    ip_address: getIpAddress(request),
  });
}

/**
 * Log payment received
 */
export async function logPaymentReceived(
  clientId: string,
  invoiceId: string,
  paymentId: string,
  amount: number,
  paymentMethod: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    action: 'payment_received',
    entity_type: 'payment',
    entity_id: paymentId,
    details: {
      invoice_id: invoiceId,
      amount,
      payment_method: paymentMethod,
    },
  });
}

/**
 * Log document access
 */
export async function logDocumentAccess(
  request: NextRequest,
  userId: string,
  clientId: string,
  documentId: string,
  action: 'upload' | 'download' | 'delete',
  filename: string
): Promise<void> {
  await logActivity({
    user_id: userId,
    client_id: clientId,
    action: `document_${action}`,
    entity_type: 'document',
    entity_id: documentId,
    details: {
      filename,
    },
    ip_address: getIpAddress(request),
  });
}

/**
 * Log user impersonation
 */
export async function logImpersonation(
  request: NextRequest,
  adminUserId: string,
  targetUserId: string,
  action: 'start' | 'stop',
  reason?: string
): Promise<void> {
  await logActivity({
    user_id: adminUserId,
    action: `impersonation_${action}`,
    entity_type: 'user',
    entity_id: targetUserId,
    details: {
      reason,
    },
    ip_address: getIpAddress(request),
  });
}

/**
 * Log ticket status change
 */
export async function logTicketStatusChange(
  request: NextRequest,
  userId: string,
  clientId: string,
  ticketId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await logActivity({
    user_id: userId,
    client_id: clientId,
    action: 'ticket_status_changed',
    entity_type: 'ticket',
    entity_id: ticketId,
    details: {
      old_status: oldStatus,
      new_status: newStatus,
    },
    ip_address: getIpAddress(request),
  });
}

/**
 * Log subscription modification
 */
export async function logSubscriptionChange(
  userId: string,
  clientId: string,
  subscriptionId: string,
  action: 'created' | 'cancelled' | 'activated' | 'suspended',
  details?: Record<string, any>
): Promise<void> {
  await logActivity({
    user_id: userId,
    client_id: clientId,
    action: `subscription_${action}`,
    entity_type: 'subscription',
    entity_id: subscriptionId,
    details,
  });
}
