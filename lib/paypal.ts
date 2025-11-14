import { Env } from "@/types";
import { AppError } from "./errors";

/**
 * PayPal API response types
 */
interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface PayPalErrorResponse {
  name?: string;
  message?: string;
  details?: Array<{
    issue: string;
    description: string;
  }>;
}

/**
 * Get PayPal API base URL based on mode
 */
function getPayPalBaseUrl(mode: 'sandbox' | 'live'): string {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Get PayPal OAuth access token
 * Required for all PayPal API calls
 */
export async function getPayPalAccessToken(env: Env): Promise<string> {
  try {
    // Base64 encode credentials for Basic auth
    const credentials = `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`;
    const auth = btoa(credentials);
    
    const baseUrl = getPayPalBaseUrl(env.PAYPAL_MODE);
    
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('PayPal authentication failed:', response.status, errorData);
      throw new AppError(
        500,
        'PayPal authentication failed',
        'PAYPAL_AUTH_ERROR',
        { status: response.status, details: errorData }
      );
    }
    
    const data: PayPalAccessTokenResponse = await response.json();
    return data.access_token;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('PayPal authentication error:', error);
    throw new AppError(
      500,
      'Failed to authenticate with PayPal',
      'PAYPAL_AUTH_ERROR'
    );
  }
}

/**
 * Handle PayPal API errors consistently
 */
export async function handlePayPalError(response: Response): Promise<never> {
  const status = response.status;
  let errorData: PayPalErrorResponse = {};
  
  try {
    errorData = await response.json();
  } catch {
    // If JSON parsing fails, continue with empty error data
  }
  
  console.error('PayPal API error:', {
    status,
    name: errorData.name,
    message: errorData.message,
    details: errorData.details,
  });
  
  // Handle specific error cases
  if (status === 401) {
    throw new AppError(
      500,
      'PayPal authentication failed',
      'PAYPAL_AUTH_ERROR',
      errorData
    );
  }
  
  if (status === 400) {
    throw new AppError(
      400,
      errorData.message || 'Invalid PayPal request',
      'PAYPAL_VALIDATION_ERROR',
      errorData
    );
  }
  
  if (status === 404) {
    throw new AppError(
      404,
      'PayPal resource not found',
      'PAYPAL_NOT_FOUND',
      errorData
    );
  }
  
  // Generic PayPal error
  throw new AppError(
    500,
    errorData.message || 'PayPal operation failed',
    'PAYPAL_ERROR',
    { status, details: errorData }
  );
}

/**
 * Make authenticated request to PayPal API
 */
export async function paypalRequest<T>(
  env: Env,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getPayPalAccessToken(env);
  const baseUrl = getPayPalBaseUrl(env.PAYPAL_MODE);
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    await handlePayPalError(response);
  }
  
  // Handle 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }
  
  return await response.json();
}

/**
 * PayPal Order types
 */
export interface PayPalOrderRequest {
  invoice_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id: string;
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

/**
 * Create a PayPal order for invoice payment
 */
export async function createPayPalOrder(
  env: Env,
  orderRequest: PayPalOrderRequest
): Promise<PayPalOrderResponse> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: orderRequest.invoice_id,
      description: orderRequest.description || `Invoice ${orderRequest.invoice_number}`,
      custom_id: orderRequest.invoice_id,
      amount: {
        currency_code: orderRequest.currency,
        value: orderRequest.amount.toFixed(2),
      },
    }],
    application_context: {
      brand_name: 'Tech Support Computer Services',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: `${appUrl}/dashboard/invoices/${orderRequest.invoice_id}?payment=success`,
      cancel_url: `${appUrl}/dashboard/invoices/${orderRequest.invoice_id}?payment=cancelled`,
    },
  };
  
  try {
    const response = await paypalRequest<PayPalOrderResponse>(
      env,
      '/v2/checkout/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderData),
      }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to create PayPal order:', error);
    throw error;
  }
}

/**
 * Capture payment for a PayPal order
 */
export async function capturePayPalOrder(
  env: Env,
  orderId: string
): Promise<PayPalCaptureResponse> {
  try {
    const response = await paypalRequest<PayPalCaptureResponse>(
      env,
      `/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
      }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to capture PayPal order:', error);
    throw error;
  }
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(
  env: Env,
  orderId: string
): Promise<PayPalOrderResponse> {
  try {
    const response = await paypalRequest<PayPalOrderResponse>(
      env,
      `/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
      }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to get PayPal order:', error);
    throw error;
  }
}

/**
 * PayPal Webhook types
 */
export interface PayPalWebhookEvent {
  id: string;
  event_version: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: any;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalWebhookVerificationRequest {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: PayPalWebhookEvent;
}

interface PayPalWebhookVerificationResponse {
  verification_status: 'SUCCESS' | 'FAILURE';
}

/**
 * Verify PayPal webhook signature
 * This ensures the webhook request actually came from PayPal
 */
export async function verifyPayPalWebhook(
  env: Env,
  webhookId: string,
  headers: {
    authAlgo: string | null;
    certUrl: string | null;
    transmissionId: string | null;
    transmissionSig: string | null;
    transmissionTime: string | null;
  },
  webhookEvent: PayPalWebhookEvent
): Promise<boolean> {
  try {
    // If any required header is missing, fail verification
    if (
      !headers.authAlgo ||
      !headers.certUrl ||
      !headers.transmissionId ||
      !headers.transmissionSig ||
      !headers.transmissionTime
    ) {
      console.error('Missing required webhook headers');
      return false;
    }

    const verificationRequest: PayPalWebhookVerificationRequest = {
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    };

    const response = await paypalRequest<PayPalWebhookVerificationResponse>(
      env,
      '/v1/notifications/verify-webhook-signature',
      {
        method: 'POST',
        body: JSON.stringify(verificationRequest),
      }
    );

    return response.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}
