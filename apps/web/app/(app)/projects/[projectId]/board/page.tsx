import React from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BoardClient } from './board-client';

export const dynamic = 'force-dynamic';

interface BoardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectId } = await params;

  // Server Component first-paint fetch from backend API
  const [project, sprints, users] = await Promise.all([
    apiClient.getProject(projectId),
    apiClient.getSprints(projectId),
    apiClient.getUsers()
  ]);

  if (!project) {
    notFound();
  }

  const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];

  // Initial slice of sprint issues from backend API
  const initialIssuesResponse = await apiClient.queryIssues({
    projectId,
    sprintId: activeSprint?.id,
    limit: 100
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <BoardClient
        project={project}
        sprints={sprints}
        activeSprint={activeSprint}
        initialIssues={initialIssuesResponse.data}
        users={users}
      />
    </div>
  );
}
