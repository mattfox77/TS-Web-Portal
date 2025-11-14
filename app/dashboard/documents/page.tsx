'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentList from '@/components/DocumentList';
import { Document } from '@/types';

interface Project {
  id: string;
  name: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = projectId
        ? `/api/documents?project_id=${projectId}`
        : '/api/documents';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
      
      // Fetch projects if not already loaded
      if (projects.length === 0) {
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const handleProjectFilterChange = (value: string) => {
    if (value) {
      router.push(`/dashboard/documents?project_id=${value}`);
    } else {
      router.push('/dashboard/documents');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage your project documents
          </p>
        </div>
      </div>

      {/* Filter by project */}
      {projects.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Project
          </label>
          <select
            id="project-filter"
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={projectId || ''}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Document</h2>
        <DocumentUpload
          projectId={projectId || undefined}
          onUploadComplete={fetchDocuments}
        />
      </div>

      {/* Documents list */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Your Documents
          {projectId && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Filtered by project)
            </span>
          )}
        </h2>
        <DocumentList
          documents={documents}
          onDelete={fetchDocuments}
        />
      </div>

      {/* Storage info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Storage Information:</strong> You can upload files up to 50MB each. Supported
              formats include PDF, Word, Excel, Text, Images, and ZIP files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
