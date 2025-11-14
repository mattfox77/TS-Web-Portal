'use client';

import { useState } from 'react';
import { Subscription, ServicePackage } from '@/types';

interface SubscriptionCardProps {
  subscription: Subscription & {
    service_package?: ServicePackage & {
      name: string;
      description: string;
      price_monthly: number;
      price_annual: number;
      features: string[];
    };
  };
  onCancel: (subscriptionId: string) => Promise<void>;
}

export default function SubscriptionCard({ subscription, onCancel }: SubscriptionCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      await onCancel(subscription.id);
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrice = () => {
    if (!subscription.service_package) return 'N/A';
    
    const price = subscription.billing_cycle === 'monthly'
      ? subscription.service_package.price_monthly
      : subscription.service_package.price_annual;
    
    return `$${price?.toFixed(2)}`;
  };

  const getBillingPeriod = () => {
    return subscription.billing_cycle === 'monthly' ? '/month' : '/year';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {subscription.service_package?.name || 'Unknown Package'}
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            {subscription.service_package?.description}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}>
          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">
          {getPrice()}
          <span className="text-lg font-normal text-gray-600">{getBillingPeriod()}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Billing Cycle:</span>
          <span className="font-medium text-gray-900">
            {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Start Date:</span>
          <span className="font-medium text-gray-900">
            {new Date(subscription.start_date).toLocaleDateString()}
          </span>
        </div>
        {subscription.next_billing_date && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Next Billing:</span>
            <span className="font-medium text-gray-900">
              {new Date(subscription.next_billing_date).toLocaleDateString()}
            </span>
          </div>
        )}
        {subscription.cancel_at_period_end && (
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Cancels at period end</span>
          </div>
        )}
      </div>

      {subscription.service_package?.features && subscription.service_package.features.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Features:</h4>
          <ul className="space-y-1">
            {subscription.service_package.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {subscription.status === 'active' && !subscription.cancel_at_period_end && (
        <div className="mt-4">
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              Cancel Subscription
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this subscription? You'll continue to have access until the end of your current billing period.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {subscription.status === 'pending' && (
        <div className="mt-4">
          <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            This subscription is pending activation. Please complete the payment process.
          </p>
        </div>
      )}

      {subscription.status === 'cancelled' && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            This subscription has been cancelled.
          </p>
        </div>
      )}

      {subscription.status === 'suspended' && (
        <div className="mt-4">
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            This subscription is suspended due to payment failure. Please update your payment method.
          </p>
        </div>
      )}
    </div>
  );
}
