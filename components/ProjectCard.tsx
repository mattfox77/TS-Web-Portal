'use client';

import Link from 'next/link';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project & {
    open_tickets?: number;
    in_progress_tickets?: number;
    closed_tickets?: number;
    total_tickets?: number;
  };
}

const statusColors = {
  planning: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const openTickets = project.open_tickets || 0;
  const inProgressTickets = project.in_progress_tickets || 0;
  const closedTickets = project.closed_tickets || 0;
  const totalTickets = project.total_tickets || 0;

  // Calculate progress percentage
  const progressPercentage = totalTickets > 0 
    ? Math.round((closedTickets / totalTickets) * 100) 
    : 0;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <span
            className={`ml-4 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              statusColors[project.status]
            }`}
          >
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Progress Bar */}
        {totalTickets > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs font-medium text-gray-900">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Ticket Stats */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Open:</span>
            <span className="font-medium text-gray-900">{openTickets}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-600">In Progress:</span>
            <span className="font-medium text-gray-900">{inProgressTickets}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Closed:</span>
            <span className="font-medium text-gray-900">{closedTickets}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          {project.start_date && (
            <div>
              <span className="font-medium">Started:</span>{' '}
              {new Date(project.start_date).toLocaleDateString()}
            </div>
          )}
          {project.estimated_completion && (
            <div>
              <span className="font-medium">Est. Completion:</span>{' '}
              {new Date(project.estimated_completion).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* GitHub Repo Link */}
        {project.github_repo && (
          <div className="mt-2 text-xs text-blue-600 hover:text-blue-800">
            <svg
              className="inline w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub Repository
          </div>
        )}
      </div>
    </Link>
  );
}
