import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';
import { IssuePriority, IssueStatus, IssueType } from '@flowline/types';
import { 
  AlertCircle, 
  ArrowUp, 
  ArrowRight, 
  ArrowDown, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Eye, 
  Bookmark, 
  Bug, 
  Layers 
} from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-300 border border-slate-700',
        primary: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
        success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        info: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  switch (priority) {
    case 'urgent':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="w-3 h-3 text-rose-400 animate-pulse" /> Urgent
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <ArrowUp className="w-3 h-3 text-amber-400" /> High
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <ArrowRight className="w-3 h-3 text-sky-400" /> Medium
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
          <ArrowDown className="w-3 h-3 text-slate-400" /> Low
        </span>
      );
  }
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  switch (status) {
    case 'backlog':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <Circle className="w-2.5 h-2.5 fill-slate-500 text-transparent" /> Backlog
        </span>
      );
    case 'todo':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
          <Circle className="w-2.5 h-2.5 fill-indigo-400 text-transparent" /> To Do
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40">
          <Clock className="w-3 h-3 text-amber-400" /> In Progress
        </span>
      );
    case 'in_review':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-800/40">
          <Eye className="w-3 h-3 text-purple-400" /> In Review
        </span>
      );
    case 'done':
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Done
        </span>
      );
  }
}

export function TypeBadge({ type }: { type: IssueType }) {
  switch (type) {
    case 'bug':
      return (
        <span title="Bug" className="inline-flex items-center justify-center p-1 rounded bg-rose-500/10 text-rose-400">
          <Bug className="w-3.5 h-3.5" />
        </span>
      );
    case 'story':
      return (
        <span title="User Story" className="inline-flex items-center justify-center p-1 rounded bg-emerald-500/10 text-emerald-400">
          <Bookmark className="w-3.5 h-3.5" />
        </span>
      );
    case 'epic':
      return (
        <span title="Epic" className="inline-flex items-center justify-center p-1 rounded bg-purple-500/10 text-purple-400">
          <Layers className="w-3.5 h-3.5" />
        </span>
      );
    case 'task':
      return (
        <span title="Task" className="inline-flex items-center justify-center p-1 rounded bg-sky-500/10 text-sky-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </span>
      );
  }
}
