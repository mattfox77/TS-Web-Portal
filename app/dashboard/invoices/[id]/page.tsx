'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Invoice, InvoiceItem, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import PayPalButton from '@/components/PayPalButton';

export default function InvoiceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchInvoice();
    
    // Check for payment callback
    const paymentParam = searchParams.get('payment');
    const token = searchParams.get('token');
    
    if (paymentParam === 'success' && token) {
      handlePaymentReturn(token);
    } else if (paymentParam === 'cancelled') {
      setPaymentStatus('cancelled');
    }
  }, [invoiceId, searchParams]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);
      setPayment(data.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentReturn = async (token: string) => {
    try {
      setProcessingPayment(true);
      
      // Capture the PayPal order
      const response = await fetch('/api/payments/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: token,
          invoice_id: invoiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment capture failed');
      }

      setPaymentStatus('success');
      
      // Refresh invoice data
      await fetchInvoice();
      
      // Clean up URL
      router.replace(`/dashboard/invoices/${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setPaymentStatus(null);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Invoice['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error || 'Invoice not found'}</p>
        </div>
        <Link
          href="/dashboard/invoices"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Status Messages */}
      {processingPayment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-sm text-blue-800">Processing your payment...</p>
          </div>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-green-800">
              Payment successful! Your invoice has been marked as paid.
            </p>
          </div>
        </div>
      )}

      {paymentStatus === 'cancelled' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              Payment was cancelled. You can try again when ready.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Invoices
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {invoice.invoice_number}
          </h1>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
        >
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
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Invoice Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Details
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issue Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.issue_date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(invoice.due_date)}
                </dd>
              </div>
              {invoice.paid_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(invoice.paid_date)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Amount Summary
            </h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                <dd className="text-sm text-gray-900">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">
                  Tax ({(invoice.tax_rate * 100).toFixed(0)}%)
                </dt>
                <dd className="text-sm text-gray-900">
                  {formatCurrency(invoice.tax_amount, invoice.currency)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <dt className="text-base font-semibold text-gray-900">Total</dt>
                <dd className="text-base font-semibold text-gray-900">
                  {formatCurrency(invoice.total, invoice.currency)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
            <p className="text-sm text-gray-900">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {formatCurrency(item.unit_price, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Information */}
      {payment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Information
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Transaction ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {payment.paypal_transaction_id || payment.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Payment Method
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {payment.payment_method.toUpperCase()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Amount Paid
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatCurrency(payment.amount, payment.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Payment Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(payment.created_at)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Pay Now Section (if unpaid) */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && !processingPayment && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pay Invoice
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Complete your payment securely with PayPal
            </p>
            <PayPalButton
              invoiceId={invoice.id}
              amount={invoice.total}
              currency={invoice.currency}
              onSuccess={() => {
                setPaymentStatus('success');
                fetchInvoice();
              }}
              onError={(error) => {
                setError(error);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
