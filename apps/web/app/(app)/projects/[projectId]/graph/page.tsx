import React from 'react';
import { notFound } from 'next/navigation';
import { mockDb } from '@flowline/mock-db';
import { GraphWrapper } from './graph-wrapper';

interface GraphPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function GraphPage({ params }: GraphPageProps) {
  const { projectId } = await params;
  const project = mockDb.getProject(projectId);
  if (!project) notFound();

  // Load a representative sample for graph exploration
  const issuesResponse = mockDb.queryIssues({
    projectId,
    limit: 60
  });

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
