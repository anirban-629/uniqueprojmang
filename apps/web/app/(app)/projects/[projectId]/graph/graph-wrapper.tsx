'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Project, Issue } from '@flowline/types';
import { Skeleton } from '@flowline/ui';

// Lazy-load GraphClient in a Client Component boundary with ssr: false
const GraphClient = dynamic(() => import('./graph-client'), {
  ssr: false,
  loading: () => (
    <div className="h-[620px] rounded-2xl border border-slate-800 bg-slate-950/60 p-8 flex items-center justify-center">
      <Skeleton className="h-48 w-72 rounded-2xl" />
    </div>
  )
});

export function GraphWrapper({ project, issues }: { project: Project; issues: Issue[] }) {
  return <GraphClient project={project} issues={issues} />;
}
