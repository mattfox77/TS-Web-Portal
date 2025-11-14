import { Env, ServicePackage } from "@/types";
import { paypalRequest } from "./paypal";

/**
 * PayPal Subscription types
 */
export interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
}

export interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  status: string;
  billing_cycles: Array<{
    frequency: {
      interval_unit: string;
      interval_count: number;
    };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme: {
      fixed_price: {
        value: string;
        currency_code: string;
      };
    };
  }>;
}

export interface PayPalSubscription {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  subscriber: {
    email_address: string;
    payer_id: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    final_payment_time: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

/**
 * Create a PayPal product for a service package
 * Products are required before creating billing plans
 */
export async function createPayPalProduct(
  env: Env,
  servicePackage: ServicePackage
): Promise<string> {
  try {
    const product = await paypalRequest<PayPalProduct>(
      env,
      '/v1/catalogs/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: servicePackage.name,
          description: servicePackage.description || `${servicePackage.name} subscription`,
          type: 'SERVICE',
          category: 'SOFTWARE',
        }),
      }
    );

    return product.id;
  } catch (error) {
    console.error('Failed to create PayPal product:', error);
    throw error;
  }
}

/**
 * Create a PayPal billing plan for a service package
 * This defines the pricing and billing frequency
 */
export async function createPayPalSubscriptionPlan(
  env: Env,
  servicePackage: ServicePackage,
  billingCycle: 'monthly' | 'annual'
): Promise<string> {
  try {
    // First, create a product if needed
    const productId = await createPayPalProduct(env, servicePackage);

    // Determine price and interval based on billing cycle
    const price = billingCycle === 'monthly'
      ? servicePackage.price_monthly
      : servicePackage.price_annual;

    if (!price) {
      throw new Error(`No ${billingCycle} price available for ${servicePackage.name}`);
    }

    const intervalUnit = billingCycle === 'monthly' ? 'MONTH' : 'YEAR';

    // Create billing plan
    const plan = await paypalRequest<PayPalPlan>(
      env,
      '/v1/billing/plans',
      {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          name: `${servicePackage.name} - ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}`,
          description: servicePackage.description || `${servicePackage.name} subscription`,
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: {
                interval_unit: intervalUnit,
                interval_count: 1,
              },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0, // 0 means infinite/until cancelled
              pricing_scheme: {
                fixed_price: {
                  value: price.toFixed(2),
                  currency_code: 'USD',
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
              value: '0',
              currency_code: 'USD',
            },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3,
          },
        }),
      }
    );

    return plan.id;
  } catch (error) {
    console.error('Failed to create PayPal subscription plan:', error);
    throw error;
  }
}

/**
 * Create a PayPal subscription for a client
 * Returns subscription ID and approval URL for user to complete
 */
export async function createPayPalSubscription(
  env: Env,
  planId: string,
  clientId: string,
  returnUrl?: string,
  cancelUrl?: string
): Promise<{ subscription_id: string; approve_url: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const subscription = await paypalRequest<PayPalSubscription>(
      env,
      '/v1/billing/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          custom_id: clientId, // Store client ID for webhook processing
          application_context: {
            brand_name: 'Tech Support Computer Services',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            },
            return_url: returnUrl || `${appUrl}/dashboard/subscriptions?status=success`,
            cancel_url: cancelUrl || `${appUrl}/dashboard/subscriptions?status=cancelled`,
          },
        }),
      }
    );

    // Find the approval URL from links
    const approveLink = subscription.links.find(link => link.rel === 'approve');
    
    if (!approveLink) {
      throw new Error('No approval URL found in subscription response');
    }

    return {
      subscription_id: subscription.id,
      approve_url: approveLink.href,
    };
  } catch (error) {
    console.error('Failed to create PayPal subscription:', error);
    throw error;
  }
}

/**
 * Get PayPal subscription details
 */
export async function getPayPalSubscription(
  env: Env,
  subscriptionId: string
): Promise<PayPalSubscription> {
  try {
    const subscription = await paypalRequest<PayPalSubscription>(
      env,
      `/v1/billing/subscriptions/${subscriptionId}`,
      {
        method: 'GET',
      }
    );

    return subscription;
  } catch (error) {
    console.error('Failed to get PayPal subscription:', error);
    throw error;
  }
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelPayPalSubscription(
  env: Env,
  subscriptionId: string,
  reason: string = 'Customer requested cancellation'
): Promise<void> {
  try {
    await paypalRequest(
      env,
      `/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: reason,
        }),
      }
    );
  } catch (error) {
    console.error('Failed to cancel PayPal subscription:', error);
    throw error;
  }
}

/**
 * Suspend a PayPal subscription
 */
export async function suspendPayPalSubscription(
  env: Env,
  subscriptionId: string,
  reason: string = 'Subscription suspended'
): Promise<void> {
  try {
    await paypalRequest(
      env,
      `/v1/billing/subscriptions/${subscriptionId}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: reason,
        }),
      }
    );
  } catch (error) {
    console.error('Failed to suspend PayPal subscription:', error);
    throw error;
  }
}

/**
 * Activate a suspended PayPal subscription
 */
export async function activatePayPalSubscription(
  env: Env,
  subscriptionId: string,
  reason: string = 'Subscription reactivated'
): Promise<void> {
  try {
    await paypalRequest(
      env,
      `/v1/billing/subscriptions/${subscriptionId}/activate`,
      {
        method: 'POST',
        body: JSON.stringify({
          reason: reason,
        }),
      }
    );
  } catch (error) {
    console.error('Failed to activate PayPal subscription:', error);
    throw error;
  }
}
