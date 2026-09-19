'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RealtimeStatusPill } from './realtime-status-pill';
import { TenantSwitcher } from './auth/tenant-switcher';
import { useAuth } from '../hooks/use-auth';
import { Avatar } from '@flowline/ui';
import { useQuery } from '@tanstack/react-query';
import { CreateProjectDialog } from './projects/create-project-dialog';
import { apiClient } from '../lib/api/client';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  ExternalLink,
  Sparkles,
  LogOut,
  Plus
} from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const { user, currentTenant, logout } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Dynamic projects query for active workspace
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', currentTenant?.companyId || currentTenant?.tenantId],
    queryFn: () => apiClient<any[]>('/api/projects'),
    staleTime: 30 * 1000,
  });

  // Extract current project from pathname if any
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : (projects[0]?.key || projects[0]?.id || 'proj-flow');

  const currentProject = projects.find(
    (p: any) => p.id === currentProjectId || p.key.toLowerCase() === currentProjectId.toLowerCase()
  ) || projects[0] || { id: 'proj-flow', key: 'PROJ', name: 'Select Project' };

  const displayName = user ? ('name' in user ? user.name : user.fullName) || 'Engineer' : 'Engineer';
  const displayRole = currentTenant?.role || (user && 'role' in user ? user.role : 'Member');
  const displayAvatar = (user && 'avatar' in user ? user.avatar : (user as any)?.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
        {/* Left: Tenant Switcher & Project selector */}
        <div className="flex items-center gap-3">
          <TenantSwitcher />

          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                {currentProject.key ? currentProject.key.slice(0, 2) : 'PR'}
              </span>
              <span className="max-w-[140px] truncate">{currentProject.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Project dropdown menu */}
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block w-64 rounded-xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md z-50">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Projects</span>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  <p>No projects yet.</p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1 w-full"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Project
                  </button>
                </div>
              ) : (
                <>
                  {projects.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.key || p.id}/board`}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        p.id === currentProjectId || p.key.toLowerCase() === currentProjectId.toLowerCase()
                          ? 'bg-primary/20 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[9px] font-bold text-foreground">
                        {p.key ? p.key.slice(0, 2) : 'PR'}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </Link>
                  ))}

                  <div className="mt-1 pt-1 border-t border-border">
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="flex items-center gap-1.5 w-full rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Project</span>
                    </button>
                  </div>
                </>
              )}
            </div>
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

    <CreateProjectDialog
      isOpen={isCreateOpen}
      onClose={() => setIsCreateOpen(false)}
    />
  </>
  );
}
