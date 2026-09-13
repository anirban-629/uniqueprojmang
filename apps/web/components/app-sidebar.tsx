'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Kanban, 
  ListTodo, 
  GitBranch, 
  BookOpen, 
  BarChart3, 
  Cpu, 
  Settings, 
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export function AppSidebar() {
  const pathname = usePathname();

  // Extract current project from pathname if any
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : 'proj-flow';

  const navItems = [
    {
      label: 'Workspace',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard
        }
      ]
    },
    {
      label: 'Project Engineering',
      items: [
        {
          name: 'Kanban Board',
          href: `/projects/${projectId}/board`,
          icon: Kanban,
          highlight: true
        },
        {
          name: '50k Backlog',
          href: `/projects/${projectId}/backlog`,
          icon: ListTodo,
          badge: '50k'
        },
        {
          name: 'Dependency Graph',
          href: `/projects/${projectId}/graph`,
          icon: GitBranch
        },
        {
          name: 'Decision Log (ADR)',
          href: `/projects/${projectId}/decisions`,
          icon: BookOpen
        }
      ]
    },
    {
      label: 'Scale & Analytics',
      items: [
        {
          name: 'Org Weather Map',
          href: '/org/weather-map',
          icon: BarChart3,
          badge: 'Health'
        },
        {
          name: 'Sprint Reports',
          href: '/reports/burndown',
          icon: BarChart3
        },
        {
          name: 'Automation Engine',
          href: '/automation',
          icon: Cpu
        }
      ]
    },
    {
      label: 'System',
      items: [
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings
        }
      ]
    }
  ];

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-slate-800 bg-slate-950/90 p-3 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {navItems.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href.includes('/projects/') && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Monorepo / Scale System Footer card */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Flowline Core</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Sub-150KB budget &bull; Edge SSE active &bull; Server Components
        </p>
      </div>
    </aside>
  );
}
