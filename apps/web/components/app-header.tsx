'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RealtimeStatusPill } from './realtime-status-pill';
import { TenantSwitcher } from './auth/tenant-switcher';
import { useAuth } from '../hooks/use-auth';
import { Avatar } from '@flowline/ui';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  ExternalLink,
  Sparkles,
  LogOut
} from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const { user, currentTenant, logout } = useAuth();

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

  const displayName = user ? ('name' in user ? user.name : user.fullName) || 'Engineer' : 'Engineer';
  const displayRole = currentTenant?.role || (user && 'role' in user ? user.role : 'Member');
  const displayAvatar = (user && 'avatar' in user ? user.avatar : (user as any)?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';


  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      {/* Left: Tenant Switcher & Project selector */}
      <div className="flex items-center gap-3">
        <TenantSwitcher />

        <div className="relative group">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              {currentProject.key.slice(0, 2)}
            </span>
            <span>{currentProject.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {/* Project dropdown menu */}
          <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-56 rounded-xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md z-50">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Switch Project
            </div>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/board`}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  p.id === currentProjectId
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[9px] font-bold text-foreground">
                  {p.key.slice(0, 2)}
                </span>
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Global Scale Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>50k+ issues loaded</span>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search 50,000+ issues, ADRs, members... (Cmd+K)"
            className="w-full rounded-lg border border-border bg-card/60 pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right: Realtime status, User profile & Logout */}
      <div className="flex items-center gap-3">
        <RealtimeStatusPill projectId={currentProjectId} />

        <Link
          href="/"
          target="_blank"
          title="View Marketing/Architecture Site"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>

        <button
          title="Notifications"
          className="relative rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Avatar
            name={displayName}
            avatar={displayAvatar}
            size="sm"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-foreground leading-none">{displayName}</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-1 capitalize">{displayRole}</div>
          </div>

          <button
            onClick={() => logout()}
            title="Log out"
            className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
