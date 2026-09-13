import React from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { GraphWrapper } from './graph-wrapper';

export const dynamic = 'force-dynamic';

interface GraphPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function GraphPage({ params }: GraphPageProps) {
  const { projectId } = await params;
  const [project, issuesResponse] = await Promise.all([
    apiClient.getProject(projectId),
    apiClient.queryIssues({ projectId, limit: 60 })
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Dependency Graph &bull; {project.name}</h1>
        <p className="text-xs text-slate-400 mt-1">
          Interactive blocker graph with localized neighborhood rendering to prevent DOM explosion at scale.
        </p>
      </div>

      <GraphWrapper project={project} issues={issuesResponse.data} />
    </div>
  );
}
