'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImpersonationBannerProps {
  impersonatedUserEmail: string;
  impersonatedUserName?: string;
}

export default function ImpersonationBanner({
  impersonatedUserEmail,
  impersonatedUserName,
}: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStopImpersonation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500 text-white py-2 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="text-sm font-medium">
            Viewing as:{' '}
            <span className="font-bold">
              {impersonatedUserName || impersonatedUserEmail}
            </span>
            {impersonatedUserName && (
              <span className="text-yellow-100 ml-1">({impersonatedUserEmail})</span>
            )}
          </span>
        </div>
        <button
          onClick={handleStopImpersonation}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-white rounded-md text-sm font-medium hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Stopping...
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Stop Viewing
            </>
          )}
        </button>
      </div>
    </div>
  );
}
