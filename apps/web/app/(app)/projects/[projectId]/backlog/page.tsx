import React from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BacklogClient } from './backlog-client';

export const dynamic = 'force-dynamic';

interface BacklogPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { projectId } = await params;

  const [project, sprints, users, initialPage] = await Promise.all([
    apiClient.getProject(projectId),
    apiClient.getSprints(projectId),
    apiClient.getUsers(),
    apiClient.queryIssues({ projectId, limit: 50 })
  ]);

  if (!project) notFound();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BacklogClient
        project={project}
        sprints={sprints}
        users={users}
        initialData={initialPage}
      />
    </div>
  );
}
