import Link from 'next/link';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface AdminStats {
  totalClients: number;
  openTickets: number;
  monthlyRevenue: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  activeProjects: number;
  activeSubscriptions: number;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  client_name: string | null;
}

async function getAdminStats(): Promise<{ stats: AdminStats; recentActivity: ActivityLogEntry[] }> {
  const { userId } = auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { env } = getRequestContext();
  const db = env.DB;

  // Verify admin
  const user = await db
    .prepare('SELECT role FROM users WHERE id = ?')
    .bind(userId)
    .first<{ role: string }>();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get total clients
  const totalClientsResult = await db
    .prepare('SELECT COUNT(*) as count FROM clients WHERE status = ?')
    .bind('active')
    .first<{ count: number }>();
  const totalClients = totalClientsResult?.count || 0;

  // Get open tickets count
  const openTicketsResult = await db
    .prepare(`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE status IN ('open', 'in_progress', 'waiting_client')
    `)
    .first<{ count: number }>();
  const openTickets = openTicketsResult?.count || 0;

  // Get monthly revenue (current month)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyRevenueResult = await db
    .prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM invoices
      WHERE status = 'paid' 
      AND paid_date >= ?
    `)
    .bind(firstDayOfMonth)
    .first<{ revenue: number }>();
  const monthlyRevenue = monthlyRevenueResult?.revenue || 0;

  // Get outstanding invoices
  const outstandingResult = await db
    .prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as amount
      FROM invoices
      WHERE status IN ('sent', 'overdue')
    `)
    .first<{ count: number; amount: number }>();
  const outstandingInvoices = outstandingResult?.count || 0;
  const outstandingAmount = outstandingResult?.amount || 0;

  // Get active projects count
  const activeProjectsResult = await db
    .prepare(`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE status IN ('planning', 'active')
    `)
    .first<{ count: number }>();
  const activeProjects = activeProjectsResult?.count || 0;

  // Get active subscriptions count
  const activeSubscriptionsResult = await db
    .prepare(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE status = 'active'
    `)
    .first<{ count: number }>();
  const activeSubscriptions = activeSubscriptionsResult?.count || 0;

  // Get recent activity (last 10 items)
  const { results: recentActivity } = await db
    .prepare(`
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email,
        c.name as client_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN clients c ON al.client_id = c.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `)
    .all<ActivityLogEntry>();

  return {
    stats: {
      totalClients,
      openTickets,
      monthlyRevenue,
      outstandingInvoices,
      outstandingAmount,
      activeProjects,
      activeSubscriptions,
    },
    recentActivity,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    ticket_created: 'Created ticket',
    ticket_updated: 'Updated ticket',
    invoice_created: 'Created invoice',
    invoice_paid: 'Paid invoice',
    payment_received: 'Received payment',
    project_created: 'Created project',
    project_updated: 'Updated project',
    document_uploaded: 'Uploaded document',
    subscription_created: 'Created subscription',
    subscription_cancelled: 'Cancelled subscription',
  };
  return labels[action] || action;
}

export default async function AdminDashboardPage() {
  const { stats, recentActivity } = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage clients, invoices, and system settings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <Link
            href="/admin/clients"
            className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            View all clients →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.openTickets}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
          </div>
          <Link
            href="/dashboard/tickets"
            className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            View all tickets →
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {stats.activeSubscriptions} active subscriptions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.outstandingAmount)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {stats.outstandingInvoices} unpaid invoices
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">
                      {activity.first_name && activity.last_name
                        ? `${activity.first_name} ${activity.last_name}`
                        : activity.email || 'System'}
                    </span>
                    {' '}
                    {getActionLabel(activity.action)}
                    {activity.client_name && (
                      <span className="text-gray-600"> for {activity.client_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/invoices/new"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Create Invoice
              </h3>
              <p className="text-sm text-gray-600">
                Generate a new invoice for a client
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/clients"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Clients
              </h3>
              <p className="text-sm text-gray-600">
                View and manage client accounts
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/projects"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Projects
              </h3>
              <p className="text-sm text-gray-600">
                View and update client projects
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/usage"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Usage Reports
              </h3>
              <p className="text-sm text-gray-600">
                View API usage and costs
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/tickets"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                View All Tickets
              </h3>
              <p className="text-sm text-gray-600">
                Manage support tickets
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Client Portal
              </h3>
              <p className="text-sm text-gray-600">
                View as a regular user
              </p>
            </div>
          </div>
        </Link>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects</h2>
          <div className="flex items-center justify-between">
            <p className="text-4xl font-bold text-gray-900">{stats.activeProjects}</p>
            <Link
              href="/admin/projects"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-2">Projects in planning or active status</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform</span>
              <span className="font-medium text-gray-900">Cloudflare Pages</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Database</span>
              <span className="font-medium text-gray-900">Cloudflare D1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Storage</span>
              <span className="font-medium text-gray-900">Cloudflare R2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
