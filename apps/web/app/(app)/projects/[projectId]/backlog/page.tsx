import React from 'react';
import { notFound } from 'next/navigation';
import { mockDb } from '@flowline/mock-db';
import { BacklogClient } from './backlog-client';

export const dynamic = 'force-dynamic';

interface BacklogPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { projectId } = await params;

  const project = mockDb.getProject(projectId);
  if (!project) notFound();

  const sprints = mockDb.getSprints(projectId);
  const users = mockDb.getUsers();

  // Initial cursor page fetch in Server Component (Instant first paint)
  const initialPage = mockDb.queryIssues({
    projectId,
    limit: 50
  });

  return (
    <div className="space-y-4">
      <BacklogClient
        project={project}
        sprints={sprints}
        users={users}
        initialData={initialPage}
      />
    </div>
  );
}
