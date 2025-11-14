'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CommentThread from '@/components/CommentThread';
import { Ticket, TicketComment } from '@/types';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_client: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTicket();
    fetchComments();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ticket not found');
        }
        throw new Error('Failed to fetch ticket');
      }
      const data = await response.json();
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket');
      }

      const data = await response.json();
      setTicket(data.ticket);
    } catch (err) {
      console.error('Error updating ticket:', err);
      alert('Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCommentAdded = (comment: TicketComment) => {
    setComments([...comments, comment]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error || 'Ticket not found'}</p>
          <Link
            href="/dashboard/tickets"
            className="mt-4 inline-block text-red-600 hover:text-red-800"
          >
            ← Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/tickets"
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to tickets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
      </div>

      {/* Ticket Details Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  statusColors[ticket.status]
                }`}
              >
                {formatStatus(ticket.status)}
              </span>
              <span
                className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  priorityColors[ticket.priority]
                }`}
              >
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
              </span>
            </div>
            
            {/* Status Update Dropdown */}
            {ticket.status !== 'closed' && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_client">Waiting Client</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            )}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Ticket ID:</span>
              <span className="ml-2 font-mono text-gray-900">{ticket.id}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 text-gray-900">{formatDate(ticket.created_at)}</span>
            </div>
            {ticket.project_name && (
              <div>
                <span className="text-gray-500">Project:</span>
                <span className="ml-2 text-gray-900">{ticket.project_name}</span>
              </div>
            )}
            {ticket.updated_at !== ticket.created_at && (
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-900">{formatDate(ticket.updated_at)}</span>
              </div>
            )}
            {ticket.resolved_at && (
              <div>
                <span className="text-gray-500">Resolved:</span>
                <span className="ml-2 text-gray-900">{formatDate(ticket.resolved_at)}</span>
              </div>
            )}
            {ticket.github_issue_url && (
              <div className="col-span-2">
                <span className="text-gray-500">GitHub Issue:</span>
                <a
                  href={ticket.github_issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  #{ticket.github_issue_number} ↗
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <div className="text-gray-900 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Comments</h2>
        <CommentThread
          ticketId={ticketId}
          comments={comments}
          onCommentAdded={handleCommentAdded}
        />
      </div>
    </div>
  );
}
