"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import ActivityFeed from "@/components/ActivityFeed";
import { 
  TicketIcon, 
  CreditCardIcon, 
  FolderIcon, 
  ExclamationCircleIcon 
} from "@heroicons/react/24/outline";
import type { User, Client, ActivityLogEntry } from "@/types";

interface DashboardStats {
  openTickets: number;
  activeProjects: number;
  unpaidInvoices: number;
  unpaidAmount: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    activeProjects: 0,
    unpaidInvoices: 0,
    unpaidAmount: 0,
  });
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch user and client data
        const userResponse = await fetch("/api/auth/user");
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }
        const userData = await userResponse.json();
        setUser(userData.user);
        setClient(userData.client);

        // Fetch dashboard stats
        const statsResponse = await fetch("/api/dashboard/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent activity
        const activityResponse = await fetch("/api/dashboard/activity");
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivities(activityData.activities || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {client?.company_name || client?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Open Tickets"
          value={stats.openTickets}
          icon={TicketIcon}
          description="Active support requests"
        />
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={FolderIcon}
          description="Projects in progress"
        />
        <StatsCard
          title="Unpaid Invoices"
          value={stats.unpaidInvoices}
          icon={CreditCardIcon}
          description="Pending payments"
        />
        <StatsCard
          title="Amount Due"
          value={`$${stats.unpaidAmount.toFixed(2)}`}
          icon={CreditCardIcon}
          description="Total outstanding"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionButton
            href="/dashboard/tickets/new"
            label="Create Ticket"
            icon={TicketIcon}
          />
          <QuickActionButton
            href="/dashboard/invoices"
            label="View Invoices"
            icon={CreditCardIcon}
          />
          <QuickActionButton
            href="/dashboard/documents"
            label="Upload Document"
            icon={FolderIcon}
          />
          <QuickActionButton
            href="/dashboard/projects"
            label="View Projects"
            icon={FolderIcon}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <ActivityFeed activities={activities} />
    </div>
  );
}

function QuickActionButton({ 
  href, 
  label, 
  icon: Icon 
}: { 
  href: string; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
    >
      <Icon className="w-5 h-5 text-blue-600" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </a>
  );
}
