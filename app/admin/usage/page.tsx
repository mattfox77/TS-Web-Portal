'use client';

import { useState, useEffect } from 'react';
import { formatCost } from '@/lib/pricing';

interface UsageSummary {
  total_cost: number;
  total_tokens: number;
  request_count: number;
}

interface DailyUsage {
  date: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

interface UsageByProvider {
  provider: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

interface UsageByModel {
  provider: string;
  model: string;
  total_tokens: number;
  total_cost: number;
  request_count: number;
}

interface ProjectSummary {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  request_count: number;
  total_tokens: number;
  total_cost: number;
}

interface UsageData {
  summary: UsageSummary;
  data: DailyUsage[] | UsageByProvider[] | UsageByModel[];
  projects: ProjectSummary[];
  filters: {
    client_id: string | null;
    project_id: string | null;
    date_from: string | null;
    date_to: string | null;
    view: string;
  };
}

export default function AdminUsagePage() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [view, setView] = useState<'daily' | 'provider' | 'model'>('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    fetchUsageData();
  }, [view, dateFrom, dateTo, projectId]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('view', view);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (projectId) params.append('project_id', projectId);

      const response = await fetch(`/api/admin/usage?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        setDateFrom(today);
        setDateTo(today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(today);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setDateFrom(monthAgo.toISOString().split('T')[0]);
        setDateTo(today);
        break;
      case 'all':
        setDateFrom('');
        setDateTo('');
        break;
    }
  };

  if (loading && !usageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Usage Analytics</h1>
        <p className="text-gray-600 mt-2">
          Monitor API usage and costs across all projects
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* View Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View
            </label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="provider">By Provider</option>
              <option value="model">By Model</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleDatePreset('today')}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => handleDatePreset('week')}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Week
              </button>
              <button
                onClick={() => handleDatePreset('month')}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Month
              </button>
              <button
                onClick={() => handleDatePreset('all')}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {usageData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Cost</h3>
              <p className="text-3xl font-bold text-gray-900">
                {formatCost(usageData.summary.total_cost)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Tokens</h3>
              <p className="text-3xl font-bold text-gray-900">
                {usageData.summary.total_tokens.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">API Requests</h3>
              <p className="text-3xl font-bold text-gray-900">
                {usageData.summary.request_count.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Usage Data Table */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {view === 'daily' && 'Daily Usage'}
                {view === 'provider' && 'Usage by Provider'}
                {view === 'model' && 'Usage by Model'}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {view === 'daily' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requests
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                        </>
                      )}
                      {view === 'provider' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Provider
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requests
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                        </>
                      )}
                      {view === 'model' && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Provider
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requests
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {view === 'daily' &&
                      (usageData.data as DailyUsage[]).map((row) => (
                        <tr key={row.date}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(row.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.request_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCost(row.total_cost)}
                          </td>
                        </tr>
                      ))}
                    {view === 'provider' &&
                      (usageData.data as UsageByProvider[]).map((row) => (
                        <tr key={row.provider}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.provider}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.request_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCost(row.total_cost)}
                          </td>
                        </tr>
                      ))}
                    {view === 'model' &&
                      (usageData.data as UsageByModel[]).map((row) => (
                        <tr key={`${row.provider}-${row.model}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.provider}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.model}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.request_count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.total_tokens.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCost(row.total_cost)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Project Summaries */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Usage by Project</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tokens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usageData.projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.client_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.request_count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {project.total_tokens.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCost(project.total_cost)}
                        </td>
                      </tr>
                    ))}
                    {usageData.projects.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No usage data found for the selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
