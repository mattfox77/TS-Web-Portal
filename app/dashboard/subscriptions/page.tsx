'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SubscriptionCard from '@/components/SubscriptionCard';
import { Subscription, ServicePackage } from '@/types';

interface SubscriptionWithPackage extends Subscription {
  service_package?: ServicePackage & {
    name: string;
    description: string;
    price_monthly: number;
    price_annual: number;
    features: string[];
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPackage[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showNewSubscription, setShowNewSubscription] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchServicePackages();

    // Check for status from PayPal redirect
    const status = searchParams.get('status');
    if (status === 'success') {
      // Refresh subscriptions after successful payment
      setTimeout(() => {
        fetchSubscriptions();
      }, 2000);
    }
  }, [searchParams]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/payments/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServicePackages = async () => {
    try {
      const response = await fetch('/api/service-packages');
      if (response.ok) {
        const data = await response.json();
        // Filter packages that have pricing
        const pricedPackages = (data.packages || []).filter(
          (pkg: ServicePackage) => pkg.price_monthly !== null || pkg.price_annual !== null
        );
        setServicePackages(pricedPackages);
      }
    } catch (error) {
      console.error('Failed to fetch service packages:', error);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedPackage) {
      alert('Please select a service package');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/payments/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_package_id: selectedPackage,
          billing_cycle: billingCycle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();
      
      // Redirect to PayPal for approval
      if (data.approve_url) {
        window.location.href = data.approve_url;
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
      alert(error instanceof Error ? error.message : 'Failed to create subscription');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/payments/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscriptions list
      await fetchSubscriptions();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  };

  const activeSubscriptions = subscriptions.filter(
    sub => sub.status === 'active' || sub.status === 'pending'
  );
  const inactiveSubscriptions = subscriptions.filter(
    sub => sub.status === 'cancelled' || sub.status === 'suspended'
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-gray-600">
          Manage your service subscriptions and billing
        </p>
      </div>

      {/* Success message */}
      {searchParams.get('status') === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-green-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Subscription activated successfully!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Your subscription is now active and billing will begin according to your selected cycle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelled message */}
      {searchParams.get('status') === 'cancelled' && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Subscription setup cancelled
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You cancelled the subscription setup. No charges have been made.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Subscription Button */}
      {!showNewSubscription && (
        <div className="mb-6">
          <button
            onClick={() => setShowNewSubscription(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + New Subscription
          </button>
        </div>
      )}

      {/* New Subscription Form */}
      {showNewSubscription && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Subscribe to a Service Package
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service Package
              </label>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a package...</option>
                {servicePackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - ${billingCycle === 'monthly' ? pkg.price_monthly : pkg.price_annual}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Billing Cycle
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={billingCycle === 'monthly'}
                    onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Monthly</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="annual"
                    checked={billingCycle === 'annual'}
                    onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Annual (Save money!)</span>
                </label>
              </div>
            </div>

            {selectedPackage && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  You'll be redirected to PayPal to complete your subscription setup.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCreateSubscription}
                disabled={isCreating || !selectedPackage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Continue to PayPal'}
              </button>
              <button
                onClick={() => {
                  setShowNewSubscription(false);
                  setSelectedPackage('');
                }}
                disabled={isCreating}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Subscriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onCancel={handleCancelSubscription}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Subscriptions */}
      {inactiveSubscriptions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Inactive Subscriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inactiveSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.id}
                subscription={subscription}
                onCancel={handleCancelSubscription}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No subscriptions yet
          </h3>
          <p className="text-gray-600 mb-6">
            Subscribe to a service package to get started with ongoing support.
          </p>
          <Link
            href="/services"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            View Service Packages
          </Link>
        </div>
      )}
    </div>
  );
}
