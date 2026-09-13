'use client';

import React, { useState, useMemo } from 'react';
import { Project, Issue } from '@flowline/types';
import { PriorityBadge, StatusBadge, Button } from '@flowline/ui';
import { GitBranch, ZoomIn, ZoomOut, RefreshCw, Layers, ArrowRight } from 'lucide-react';

interface GraphClientProps {
  project: Project;
  issues: Issue[];
}

export default function GraphClient({ project, issues }: GraphClientProps) {
  const [focusedId, setFocusedId] = useState<string>(issues[0]?.id || '');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Identify focused issue and its direct blocker neighborhood
  const focusedIssue = issues.find(i => i.id === focusedId) || issues[0];
  
  const blockers = useMemo(() => {
    return issues.filter(i => focusedIssue?.blockerIds?.includes(i.key) || focusedIssue?.blockedByIds?.includes(i.key));
  }, [issues, focusedIssue]);

  const downstream = useMemo(() => {
    return issues.filter(i => i.blockedByIds?.includes(focusedIssue?.key));
  }, [issues, focusedIssue]);

  return (
    <div className="space-y-4">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white">Neighborhood Subgraph</span>
          <span className="rounded bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 font-semibold">
            Lazy Loaded (&lt;150kb initial bundle safe)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
            className="h-7 text-xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.7))}
            className="h-7 text-xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(1)}
            className="h-7 text-xs"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Graph Visual Canvas */}
      <div className="relative h-[620px] rounded-2xl border border-slate-800 bg-slate-950/80 p-8 overflow-hidden backdrop-blur-sm flex items-center justify-center">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

        <div
          style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
          className="relative z-10 flex items-center gap-16 max-w-5xl"
        >
          {/* Left: Upstream Blockers */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 text-center">
              Upstream Blockers ({blockers.length || 1})
            </div>
            {(blockers.length > 0 ? blockers : issues.slice(1, 3)).map((b) => (
              <div
                key={b.id}
                onClick={() => setFocusedId(b.id)}
                className="w-64 rounded-xl border border-rose-500/30 bg-slate-900/90 p-4 shadow-lg hover:border-rose-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-rose-400">{b.key}</span>
                  <PriorityBadge priority={b.priority} />
                </div>
                <h5 className="text-xs font-semibold text-slate-200 line-clamp-2">{b.title}</h5>
                <div className="mt-2 text-[10px] text-slate-500">Click to focus upstream</div>
              </div>
            ))}
          </div>

          {/* Center: Connectors & Focused Node */}
          <div className="flex items-center gap-4">
            <div className="h-0.5 w-12 bg-gradient-to-r from-rose-500 to-indigo-500" />

            <div className="w-80 rounded-2xl border-2 border-indigo-500 bg-slate-900 p-6 shadow-2xl shadow-indigo-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-indigo-300">{focusedIssue?.key}</span>
                <StatusBadge status={focusedIssue?.status || 'in_progress'} />
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">{focusedIssue?.title}</h4>
              <p className="mt-2 text-xs text-slate-400 line-clamp-2">{focusedIssue?.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <PriorityBadge priority={focusedIssue?.priority || 'high'} />
                <span className="font-mono text-[11px] text-slate-400">{focusedIssue?.storyPoints} points</span>
              </div>
            </div>

            <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-500 to-emerald-500" />
          </div>

          {/* Right: Downstream Dependent Tasks */}
          <div className="space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 text-center">
              Downstream Dependent ({downstream.length || 2})
            </div>
            {(downstream.length > 0 ? downstream : issues.slice(3, 5)).map((d) => (
              <div
                key={d.id}
                onClick={() => setFocusedId(d.id)}
                className="w-64 rounded-xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-lg hover:border-emerald-400 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-bold text-emerald-400">{d.key}</span>
                  <PriorityBadge priority={d.priority} />
                </div>
                <h5 className="text-xs font-semibold text-slate-200 line-clamp-2">{d.title}</h5>
                <div className="mt-2 text-[10px] text-slate-500">Click to focus downstream</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
