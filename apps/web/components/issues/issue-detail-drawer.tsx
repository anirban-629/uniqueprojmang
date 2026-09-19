'use client';

import React, { useState } from 'react';
import { Issue, User, Comment } from '@flowline/types';
import { PriorityBadge, StatusBadge, TypeBadge, Avatar, Button, Textarea } from '@flowline/ui';
import { 
  X, 
  Clock, 
  User as UserIcon, 
  Layers, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface IssueDetailDrawerProps {
  issue: Issue | null;
  users: User[];
  onClose: () => void;
  onStatusChange?: (status: Issue['status']) => void;
}

export function IssueDetailDrawer({
  issue,
  users,
  onClose,
  onStatusChange
}: IssueDetailDrawerProps) {
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  React.useEffect(() => {
    if (!issue?.id) return;
    setLoadingComments(true);
    fetch(`/api/comments?issueId=${issue.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setLocalComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setLocalComments([]);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [issue?.id]);

  if (!issue) return null;

  const assignee = users.find(u => u.id === issue.assigneeId);
  const reporter = users.find(u => u.id === issue.reporterId);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentBody = newComment.trim();
    if (!commentBody) return;

    const optimisticComment: Comment = {
      id: `c-${Date.now()}`,
      issueId: issue.id,
      authorId: users[0]?.id || '10000000-0000-0000-0000-000000000001',
      body: commentBody,
      createdAt: new Date().toISOString()
    };

    setLocalComments(prev => [...prev, optimisticComment]);
    setNewComment('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          body: commentBody
        })
      });
      if (res.ok) {
        const savedComment = await res.json();
        setLocalComments(prev =>
          prev.map(c => (c.id === optimisticComment.id ? savedComment : c))
        );
      }
    } catch {
      // Keep optimistic comment or rollback
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <TypeBadge type={issue.type} />
          <span className="font-mono text-xs font-bold text-slate-400">{issue.key}</span>
          <StatusBadge status={issue.status} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${issue.projectId}/issues/${issue.key}`}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Open Full Page"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{issue.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span>Created {new Date(issue.createdAt).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span>Rank token: <code className="text-slate-400 font-mono text-[10px]">{issue.rank}</code></span>
          </div>
        </div>

        {/* Quick Properties Grid */}
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Assignee</span>
            <div className="flex items-center gap-2 text-slate-200 font-medium">
              <Avatar name={assignee?.name || 'Unassigned'} avatar={assignee?.avatar} size="xs" />
              <span>{assignee?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Priority</span>
            <PriorityBadge priority={issue.priority} />
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Story Points</span>
            <span className="inline-flex items-center justify-center h-5 w-6 rounded bg-slate-800 font-bold text-slate-200">
              {issue.storyPoints ?? '—'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1 font-medium">Status</span>
            <select
              value={issue.status}
              onChange={(e) => onStatusChange?.(e.target.value as any)}
              aria-label="Issue Status"
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {issue.description}
          </div>
        </div>

        {/* Labels & Dependencies */}
        {issue.labels.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Labels</h3>
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.map(l => (
                <span key={l} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                  #{l}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity & Comment Stream */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Activity &amp; Comments ({localComments.length})
          </h3>

          <div className="space-y-3">
            {localComments.map(cmt => {
              const author = users.find(u => u.id === cmt.authorId);
              return (
                <div key={cmt.id} className="flex gap-3 text-xs">
                  <Avatar name={author?.name || 'User'} avatar={author?.avatar} size="xs" />
                  <div className="flex-1 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{author?.name || 'Team Member'}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{cmt.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddComment} className="mt-4 space-y-2">
            <Textarea
              placeholder="Add a comment or incident note..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="text-xs min-h-[60px]"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="primary" className="gap-1.5 text-xs">
                <Send className="w-3 h-3" /> Comment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
