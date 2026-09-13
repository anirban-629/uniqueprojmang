import React from 'react';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { PriorityBadge, StatusBadge, TypeBadge, Avatar, Button } from '@flowline/ui';
import { IssueDetailDrawer } from '@/components/issues/issue-detail-drawer';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Shield, Hash, Layers } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface IssuePageProps {
  params: Promise<{ projectId: string; id: string }>;
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { projectId, id } = await params;
  const [project, issue, users, comments] = await Promise.all([
    apiClient.getProject(projectId),
    apiClient.getIssue(id),
    apiClient.getUsers(),
    apiClient.getComments(id)
  ]);

  if (!project || !issue) notFound();

  const assignee = users.find(u => u.id === issue.assigneeId);
  const reporter = users.find(u => u.id === issue.reporterId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href={`/projects/${projectId}/board`}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Board
        </Link>
        <span>/</span>
        <span className="text-slate-200">{project.name}</span>
        <span>/</span>
        <span className="font-mono text-indigo-400">{issue.key}</span>
      </div>

      {/* Main Issue Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <TypeBadge type={issue.type} />
            <span className="font-mono text-sm font-bold text-slate-400">{issue.key}</span>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Rank: <code className="font-mono text-slate-300">{issue.rank}</code></span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {issue.title}
        </h1>

        {/* Server-Rendered Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Assignee</span>
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Avatar name={assignee?.name || 'Unassigned'} avatar={assignee?.avatar} size="xs" />
              <span>{assignee?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Reporter</span>
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Avatar name={reporter?.name || 'User'} avatar={reporter?.avatar} size="xs" />
              <span>{reporter?.name || 'User'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Story Points</span>
            <span className="font-bold text-slate-200">{issue.storyPoints ?? '—'} points</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Created</span>
            <span className="text-slate-200">{new Date(issue.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scope &amp; Description</h3>
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {issue.description}
          </div>
        </div>

        {/* Comments Section (Static pre-render with optimistic comment support) */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-bold text-white">Discussion &amp; Telemetry Log ({comments.length})</h3>

          <div className="space-y-3">
            {comments.map((cmt) => {
              const author = users.find(u => u.id === cmt.authorId);
              return (
                <div key={cmt.id} className="flex gap-3 text-xs">
                  <Avatar name={author?.name || 'Member'} avatar={author?.avatar} size="xs" />
                  <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200">{author?.name || 'Elena Rostova'}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(cmt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{cmt.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
