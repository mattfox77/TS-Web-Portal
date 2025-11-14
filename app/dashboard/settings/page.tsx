'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface NotificationPreferences {
  tickets: boolean;
  invoices: boolean;
  payments: boolean;
  subscriptions: boolean;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    tickets: true,
    invoices: true,
    payments: true,
    subscriptions: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.notification_preferences) {
          setPreferences(data.user.notification_preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving preferences' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and notifications</p>
      </div>

      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Notifications</h2>
        <p className="text-gray-600 mb-6">
          Choose which email notifications you want to receive
        </p>

        <div className="space-y-4">
          {/* Tickets */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Support Tickets</h3>
              <p className="text-sm text-gray-600">
                Notifications when tickets are created, updated, or resolved
              </p>
            </div>
            <button
              onClick={() => handleToggle('tickets')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.tickets ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle ticket notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.tickets ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Invoices */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Invoices</h3>
              <p className="text-sm text-gray-600">
                Notifications when new invoices are generated
              </p>
            </div>
            <button
              onClick={() => handleToggle('invoices')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.invoices ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle invoice notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.invoices ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Payments */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Payments</h3>
              <p className="text-sm text-gray-600">
                Notifications when payments are received and receipts
              </p>
            </div>
            <button
              onClick={() => handleToggle('payments')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.payments ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle payment notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.payments ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Subscriptions */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900">Subscriptions</h3>
              <p className="text-sm text-gray-600">
                Notifications about subscription renewals, cancellations, and payment issues
              </p>
            </div>
            <button
              onClick={() => handleToggle('subscriptions')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.subscriptions ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label="Toggle subscription notifications"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.subscriptions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {message && (
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
