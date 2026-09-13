'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RealtimeStatusPill } from './realtime-status-pill';
import { Avatar } from '@flowline/ui';
import { 
  Bell, 
  Search, 
  Layers, 
  ChevronDown, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();

  // Extract current project from pathname if any
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : 'proj-flow';

  const projects = [
    { id: 'proj-flow', key: 'FLOW', name: 'Flowline Platform' },
    { id: 'proj-core', key: 'CORE', name: 'Core Sync & DB Engine' },
    { id: 'proj-infra', key: 'INFRA', name: 'Edge & Infrastructure' },
    { id: 'proj-desk', key: 'DESK', name: 'Operations & Service Desk' }
  ];

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md">
      {/* Left: Project selector */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <button className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-colors">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-600 text-[10px] font-bold text-white">
              {currentProject.key.slice(0, 2)}
            </span>
            <span>{currentProject.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Project dropdown menu */}
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-56 rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-md z-50">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Switch Project
            </div>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/board`}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  p.id === currentProjectId
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-slate-800 text-[9px] font-bold text-slate-300">
                  {p.key.slice(0, 2)}
                </span>
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Global Scale Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-800">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>50k+ issues loaded</span>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search 50,000+ issues, ADRs, members... (Cmd+K)"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right: Realtime status & User */}
      <div className="flex items-center gap-3">
        <RealtimeStatusPill projectId={currentProjectId} />

        <Link
          href="/"
          target="_blank"
          title="View Marketing/Architecture Site"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>

        <button
          title="Notifications"
          className="relative rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <Avatar
            name="Elena Rostova"
            avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
            size="sm"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200 leading-none">Elena Rostova</div>
            <div className="text-[10px] text-slate-500 leading-none mt-1">Tech Lead</div>
          </div>
        </div>
      </div>
    </header>
  );
}
