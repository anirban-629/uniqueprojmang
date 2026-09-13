import React from 'react';
import { notFound } from 'next/navigation';
import { mockDb } from '@flowline/mock-db';
import { BoardClient } from './board-client';

export const dynamic = 'force-dynamic';

interface BoardPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { projectId } = await params;

  // Server Component first-paint fetch (eliminates loading spinner)
  const project = mockDb.getProject(projectId);
  if (!project) {
    notFound();
  }

  const sprints = mockDb.getSprints(projectId);
  const activeSprint = sprints.find(s => s.status === 'active') || sprints[0];
  const users = mockDb.getUsers();

  // Initial slice of sprint issues from server (Server Component pre-hydration)
  const initialIssuesResponse = mockDb.queryIssues({
    projectId,
    sprintId: activeSprint?.id,
    limit: 100
  });

  return (
    <div className="space-y-4">
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
