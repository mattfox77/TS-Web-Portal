import Link from 'next/link';

interface AdminClientCardProps {
  client: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
    phone?: string;
    status: string;
    created_at: string;
    open_tickets?: number;
    unpaid_invoices?: number;
    outstanding_amount?: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminClientCard({ client }: AdminClientCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {client.name}
          </h3>
          {client.company_name && (
            <p className="text-sm text-gray-600 truncate">
              {client.company_name}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            client.status === 'active'
              ? 'bg-green-100 text-green-800'
              : client.status === 'inactive'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {client.status}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <svg
            className="h-4 w-4 mr-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {client.email}
        </div>
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="h-4 w-4 mr-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {client.phone}
          </div>
        )}
      </div>

      {(client.open_tickets !== undefined || client.unpaid_invoices !== undefined) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {client.open_tickets !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Open Tickets</p>
                <p className="text-lg font-semibold text-gray-900">
                  {client.open_tickets}
                </p>
              </div>
            )}
            {client.unpaid_invoices !== undefined && (
              <div>
                <p className="text-xs text-gray-500">Unpaid Invoices</p>
                <p className="text-lg font-semibold text-gray-900">
                  {client.unpaid_invoices}
                </p>
              </div>
            )}
          </div>
          {client.outstanding_amount !== undefined && client.outstanding_amount > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500">Outstanding Amount</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(client.outstanding_amount)}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>Joined {formatDate(client.created_at)}</span>
        <Link
          href={`/admin/clients/${client.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
