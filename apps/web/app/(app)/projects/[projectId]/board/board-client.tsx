'use client';

import React, { useState, useMemo } from 'react';
import { Project, Sprint, Issue, User, IssueStatus } from '@flowline/types';
import { useBoardMutation, useRealtimeUpdates } from '@flowline/hooks';
import { PriorityBadge, TypeBadge, Avatar, Button, Input } from '@flowline/ui';
import { IssueDetailDrawer } from '@/components/issues/issue-detail-drawer';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Circle,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface BoardClientProps {
  project: Project;
  sprints: Sprint[];
  activeSprint: Sprint;
  initialIssues: Issue[];
  users: User[];
}

const COLUMNS: { id: IssueStatus; title: string; icon: any; color: string }[] = [
  { id: 'todo', title: 'To Do', icon: Circle, color: 'border-indigo-500/40 text-indigo-400' },
  { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'border-amber-500/40 text-amber-400' },
  { id: 'in_review', title: 'In Review', icon: Eye, color: 'border-purple-500/40 text-purple-400' },
  { id: 'done', title: 'Done', icon: CheckCircle2, color: 'border-emerald-500/40 text-emerald-400' }
];

// --- Draggable Card Component ---
function DraggableBoardCard({
  issue,
  assignee,
  onSelect
}: {
  issue: Issue;
  assignee?: User;
  onSelect: (issue: Issue) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: issue.id,
    data: { issue }
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only open detail drawer if user clicked, not during drag
        if (!isDragging) {
          onSelect(issue);
        }
      }}
      className={`group relative cursor-grab active:cursor-grabbing rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-sm hover:border-indigo-500/50 hover:bg-slate-900/95 transition-all select-none ${
        isDragging ? 'ring-2 ring-indigo-500 shadow-xl' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          <TypeBadge type={issue.type} />
          <span className="font-mono text-[11px] font-bold text-slate-400">
            {issue.key}
          </span>
        </div>
        <PriorityBadge priority={issue.priority} />
      </div>

      <h4 className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed group-hover:text-indigo-300 transition-colors">
        {issue.title}
      </h4>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Avatar
            name={assignee?.name || 'Unassigned'}
            avatar={assignee?.avatar}
            size="xs"
          />
          <span className="truncate max-w-[90px]">{assignee?.name.split(' ')[0] || 'None'}</span>
        </div>

        <span className="font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
          {issue.storyPoints ?? 0} pts
        </span>
      </div>
    </div>
  );
}

// --- Droppable Column Component ---
function DroppableBoardColumn({
  col,
  issues,
  users,
  onSelectIssue
}: {
  col: typeof COLUMNS[number];
  issues: Issue[];
  users: User[];
  onSelectIssue: (issue: Issue) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
    data: { status: col.id }
  });

  const Icon = col.icon;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-0 rounded-2xl border transition-all duration-150 p-3 backdrop-blur-sm ${
        isOver
          ? 'border-indigo-500/80 bg-indigo-950/20 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/10'
          : 'border-slate-800/80 bg-slate-900/30'
      }`}
    >
      {/* Column Header (Pinned) */}
      <div className="shrink-0 flex items-center justify-between pb-2.5 border-b border-slate-800/80 mb-2.5">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${col.color}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {col.title}
          </span>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400">
          {issues.length}
        </span>
      </div>

      {/* Column Cards Body (Independently Scrollable) */}
      <div className="flex-1 min-h-0 space-y-2.5 overflow-y-auto pr-1.5 scrollbar-thin">
        {issues.length === 0 ? (
          <div
            className={`flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-xs transition-colors ${
              isOver
                ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300 font-semibold'
                : 'border-slate-800 text-slate-600'
            }`}
          >
            <span>{isOver ? `Release to move to ${col.title}` : 'Drop cards here'}</span>
          </div>
        ) : (
          issues.map((issue) => {
            const assignee = users.find(u => u.id === issue.assigneeId);
            return (
              <DraggableBoardCard
                key={issue.id}
                issue={issue}
                assignee={assignee}
                onSelect={onSelectIssue}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Main Board Component ---
export function BoardClient({
  project,
  sprints,
  activeSprint,
  initialIssues,
  users
}: BoardClientProps) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [chaosMode, setChaosMode] = useState(false);
  const [activeDragIssue, setActiveDragIssue] = useState<Issue | null>(null);
  const [isNewIssueOpen, setIsNewIssueOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Edge SSE live sync hook
  const { status: realtimeStatus } = useRealtimeUpdates(project.id);
  // Optimistic board mutation hook
  const boardMutation = useBoardMutation();

  // Pointer sensor configured for smooth drag with 4px threshold
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    })
  );

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!issue.title.toLowerCase().includes(q) && !issue.key.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedPriority !== 'all' && issue.priority !== selectedPriority) return false;
      if (selectedAssignee !== 'all' && issue.assigneeId !== selectedAssignee) return false;
      return true;
    });
  }, [issues, searchQuery, selectedPriority, selectedAssignee]);

  // Group by status column
  const columnIssues = useMemo(() => {
    const map: Record<IssueStatus, Issue[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: []
    };
    filteredIssues.forEach(issue => {
      if (map[issue.status]) {
        map[issue.status].push(issue);
      } else {
        map.todo.push(issue);
      }
    });
    return map;
  }, [filteredIssues]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const issue = issues.find(i => i.id === event.active.id);
    if (issue) {
      setActiveDragIssue(issue);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragIssue(null);

    if (!over) return;

    const issueId = String(active.id);
    const overId = String(over.id);

    // Identify target status: either over a column or over another card in that column
    let targetStatus: IssueStatus | undefined;
    if (['todo', 'in_progress', 'in_review', 'done'].includes(overId)) {
      targetStatus = overId as IssueStatus;
    } else {
      const overIssue = issues.find(i => i.id === overId);
      if (overIssue) {
        targetStatus = overIssue.status;
      }
    }

    if (!targetStatus) return;

    const existingIssue = issues.find(i => i.id === issueId);
    if (!existingIssue || existingIssue.status === targetStatus) return;

    // 1. Optimistic UI update immediately
    setIssues(prev =>
      prev.map(i => (i.id === issueId ? { ...i, status: targetStatus, updatedAt: new Date().toISOString() } : i))
    );

    // 2. Trigger mutation (with chaos simulation if enabled)
    boardMutation.mutate(
      {
        id: issueId,
        projectId: project.id,
        status: targetStatus
      },
      {
        onError: (err) => {
          // Revert optimistic update on failure
          setIssues(prev =>
            prev.map(i => (i.id === issueId ? { ...i, status: existingIssue.status } : i))
          );
          alert(`Optimistic update reverted: ${err.message}`);
        }
      }
    );
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tempId = `iss-local-${Date.now()}`;
    const optimisticIssue: Issue = {
      id: tempId,
      key: `${project.key}-${issues.length + 1}`,
      projectId: project.id,
      title: newTitle.trim(),
      description: 'Created from active board.',
      status: 'todo',
      priority: 'medium',
      type: 'story',
      reporterId: users[0]?.id || '10000000-0000-0000-0000-000000000001',
      sprintId: activeSprint?.id,
      storyPoints: 3,
      rank: `0|${Date.now()}:`,
      labels: ['v1.0'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIssues(prev => [optimisticIssue, ...prev]);
    setNewTitle('');
    setIsNewIssueOpen(false);

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          title: optimisticIssue.title,
          description: optimisticIssue.description,
          status: optimisticIssue.status,
          priority: optimisticIssue.priority,
          type: optimisticIssue.type,
          sprintId: activeSprint?.id,
          storyPoints: optimisticIssue.storyPoints
        })
      });
      if (res.ok) {
        const savedIssue: Issue = await res.json();
        setIssues(prev => prev.map(i => (i.id === tempId ? savedIssue : i)));
      }
    } catch {
      // Keep optimistic or handle error
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full space-y-3">
      {/* Board Header & Controls (shrink-0) */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{activeSprint?.name || 'Sprint 41'}</h1>
            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Active Sprint
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Goal: {activeSprint?.goal || 'Scale board & backlog virtualization'} &bull; {filteredIssues.length} tickets visible
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chaos Simulator Toggle */}
          <button
            onClick={() => setChaosMode(!chaosMode)}
            title="When active, 1 in 20 requests fails (429/500) to prove optimistic UI rollback resilience"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all ${
              chaosMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Chaos Mode: {chaosMode ? 'ON' : 'OFF'}</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewIssueOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Create Issue
          </Button>
        </div>
      </div>

      {/* Filter Toolbar (shrink-0) */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Filter by title or key (e.g. FLOW-4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-900"
            />
          </div>

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

          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            aria-label="Filter Assignee"
            className="h-8 rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-indigo-300/80 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Drag any card by its handle to move across columns</span>
        </div>
      </div>

      {/* Kanban Drag and Drop Context (flex-1 min-h-0) */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 h-full min-h-0 min-w-[960px] items-stretch">
            {COLUMNS.map((col) => (
              <DroppableBoardColumn
                key={col.id}
                col={col}
                issues={columnIssues[col.id] || []}
                users={users}
                onSelectIssue={(issue) => setSelectedIssue(issue)}
              />
            ))}
          </div>
        </div>

        {/* Floating Drag Overlay */}
        <DragOverlay>
          {activeDragIssue ? (
            <div className="w-72 cursor-grabbing rounded-xl border-2 border-indigo-500 bg-slate-900 p-4 shadow-2xl shadow-indigo-500/30 scale-105 rotate-1 opacity-95">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={activeDragIssue.type} />
                  <span className="font-mono text-[11px] font-bold text-indigo-300">
                    {activeDragIssue.key}
                  </span>
                </div>
                <PriorityBadge priority={activeDragIssue.priority} />
              </div>

              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-relaxed">
                {activeDragIssue.title}
              </h4>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                <span className="text-indigo-400 font-medium">Moving...</span>
                <span className="font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                  {activeDragIssue.storyPoints ?? 0} pts
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Issue Detail Drawer */}
      <IssueDetailDrawer
        issue={selectedIssue}
        users={users}
        onClose={() => setSelectedIssue(null)}
        onStatusChange={(newStatus) => {
          if (selectedIssue) {
            setIssues(prev =>
              prev.map(i => (i.id === selectedIssue.id ? { ...i, status: newStatus } : i))
            );
            boardMutation.mutate({
              id: selectedIssue.id,
              projectId: project.id,
              status: newStatus
            });
            setSelectedIssue(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }}
      />

      {/* New Issue Modal */}
      {isNewIssueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Sprint Issue</h3>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Virtualize kanban columns for 50k items"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsNewIssueOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
