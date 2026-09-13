'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Project, Sprint, Issue, User, PaginatedResponse } from '@flowline/types';
import { useInfiniteIssues } from '@flowline/hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PriorityBadge, StatusBadge, TypeBadge, Avatar, Button, Input } from '@flowline/ui';
import { IssueDetailDrawer } from '@/components/issues/issue-detail-drawer';
import { 
  Search, 
  Cpu, 
  Database, 
  Layers, 
  ChevronRight, 
  ArrowDownCircle,
  Sparkles,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';

interface BacklogClientProps {
  project: Project;
  sprints: Sprint[];
  users: User[];
  initialData: PaginatedResponse<Issue>;
}

export function BacklogClient({
  project,
  sprints,
  users,
  initialData
}: BacklogClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // TanStack Query Infinite Cursor-Pagination Hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteIssues({
    projectId: project.id,
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as any) : undefined,
    priority: selectedPriority !== 'all' ? (selectedPriority as any) : undefined
  });

  // Flatten all fetched cursor pages
  const allIssues = useMemo(() => {
    if (!data?.pages) return initialData.data;
    return data.pages.flatMap(page => page.data);
  }, [data, initialData]);

  // Virtualizer container ref
  const parentRef = useRef<HTMLDivElement>(null);

  // Setup virtualization for high-scale list rendering
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allIssues.length + 1 : allIssues.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // 64px row height
    overscan: 10
  });

  // Infinite scroll trigger on reach bottom
  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= allIssues.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allIssues.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems()
  ]);

  const latestPage = data?.pages[data.pages.length - 1] || initialData;
  const currentCursor = latestPage.nextCursor;
  const totalEstimate = latestPage.totalEstimate || 25000;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Backlog &bull; {project.name}</h1>
            <span className="rounded-md bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              {totalEstimate.toLocaleString()} Issues
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Virtualized windowing with cursor pagination. Smooth 60fps scrolling across 50,000 indexed tickets.
          </p>
        </div>

        {/* Telemetry pill */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cursor: <code className="font-mono text-indigo-300">{currentCursor ? currentCursor.slice(0, 14) : 'END'}</code></span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>Virtual DOM: ~{rowVirtualizer.getVirtualItems().length} nodes</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by title or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-900"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter Status"
            className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            aria-label="Filter Priority"
            className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing {allIssues.length} loaded of {totalEstimate.toLocaleString()} total
        </div>
      </div>

      {/* Virtualized List Container */}
      <div
        ref={parentRef}
        className="h-[640px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/40 backdrop-blur-sm relative"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > allIssues.length - 1;
            const issue = allIssues[virtualRow.index];

            if (isLoaderRow) {
              return (
                <div
                  key="loader"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                  className="flex items-center justify-center text-xs text-slate-400 gap-2 border-b border-slate-800/60"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Fetching next cursor batch...</span>
                </div>
              );
            }

            const assignee = users.find(u => u.id === issue.assigneeId);

            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="flex items-center justify-between px-4 border-b border-slate-800/60 hover:bg-slate-900/60 cursor-pointer transition-colors group"
              >
                {/* Left: Type, Key, Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <TypeBadge type={issue.type} />
                  <span className="font-mono text-xs font-bold text-slate-400 shrink-0">
                    {issue.key}
                  </span>
                  <span className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {issue.title}
                  </span>
                </div>

                {/* Right: Labels, Priority, Points, Assignee */}
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={issue.status} />
                  <PriorityBadge priority={issue.priority} />

                  <span className="inline-flex items-center justify-center h-5 w-6 rounded bg-slate-800/80 text-[10px] font-bold text-slate-300">
                    {issue.storyPoints ?? 0}
                  </span>

                  <Avatar
                    name={assignee?.name || 'Unassigned'}
                    avatar={assignee?.avatar}
                    size="xs"
                  />

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issue Detail Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        users={users}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
}
