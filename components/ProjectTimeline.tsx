'use client';

import { Project } from '@/types';

interface ProjectTimelineProps {
  project: Project;
}

interface TimelineEvent {
  date: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
}

export default function ProjectTimeline({ project }: ProjectTimelineProps) {
  const events: TimelineEvent[] = [];

  // Add start date
  if (project.start_date) {
    events.push({
      date: project.start_date,
      label: 'Project Started',
      status: 'completed',
      description: 'Project initiated and planning completed',
    });
  }

  // Add current status milestone
  const now = new Date().toISOString();
  if (project.status === 'active') {
    events.push({
      date: now,
      label: 'In Progress',
      status: 'current',
      description: 'Project is actively being worked on',
    });
  } else if (project.status === 'on_hold') {
    events.push({
      date: now,
      label: 'On Hold',
      status: 'current',
      description: 'Project temporarily paused',
    });
  }

  // Add estimated completion
  if (project.estimated_completion) {
    const isPast = new Date(project.estimated_completion) < new Date();
    events.push({
      date: project.estimated_completion,
      label: 'Estimated Completion',
      status: isPast ? 'completed' : 'upcoming',
      description: 'Target completion date',
    });
  }

  // Add actual completion
  if (project.actual_completion) {
    events.push({
      date: project.actual_completion,
      label: 'Project Completed',
      status: 'completed',
      description: 'Project successfully delivered',
    });
  }

  // Sort events by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline events available
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={eventIdx}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      event.status === 'completed'
                        ? 'bg-green-500'
                        : event.status === 'current'
                        ? 'bg-blue-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    {event.status === 'completed' ? (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : event.status === 'current' ? (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.label}
                    </p>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-gray-500">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={event.date}>
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
