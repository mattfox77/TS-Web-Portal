'use client';

import { useEffect, useState } from 'react';
import TicketForm from '@/components/TicketForm';
import { Project } from '@/types';

export default function NewTicketPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Support Ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit a new support request. We'll review it and respond as soon as possible.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <TicketForm projects={projects} />
        )}
      </div>
    </div>
  );
}
