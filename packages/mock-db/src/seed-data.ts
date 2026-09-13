import { Project, User, Sprint, DecisionRecord, AutomationRule } from '@flowline/types';

export const SEED_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'tech_lead',
    teamId: 'team-flow'
  },
  {
    id: 'usr-2',
    name: 'Marcus Vance',
    email: 'marcus.vance@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'engineer',
    teamId: 'team-flow'
  },
  {
    id: 'usr-3',
    name: 'Aria Chen',
    email: 'aria.chen@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'product_manager',
    teamId: 'team-flow'
  },
  {
    id: 'usr-4',
    name: 'Devon Wright',
    email: 'devon.wright@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'engineer',
    teamId: 'team-core'
  },
  {
    id: 'usr-5',
    name: 'Sofia Alvarez',
    email: 'sofia.alvarez@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'designer',
    teamId: 'team-flow'
  },
  {
    id: 'usr-6',
    name: 'Tariq Malik',
    email: 'tariq.malik@flowline.internal',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    role: 'engineer',
    teamId: 'team-infra'
  }
];

export const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-flow',
    key: 'FLOW',
    name: 'Flowline Platform',
    description: 'Next.js 15 enterprise project management client & high-concurrency UI architecture.',
    leadId: 'usr-1',
    memberCount: 42,
    color: '#6366f1',
    createdAt: '2025-01-10T00:00:00.000Z'
  },
  {
    id: 'proj-core',
    key: 'CORE',
    name: 'Core Sync & Data Engine',
    description: 'Distributed persistence layer, cursor pagination indexes, and pub-sub bus.',
    leadId: 'usr-4',
    memberCount: 28,
    color: '#0ea5e9',
    createdAt: '2025-01-12T00:00:00.000Z'
  },
  {
    id: 'proj-infra',
    key: 'INFRA',
    name: 'Edge & Cloud Infrastructure',
    description: 'Global CDN, Kubernetes cluster orchestration, and zero-trust edge gateway.',
    leadId: 'usr-6',
    memberCount: 16,
    color: '#10b981',
    createdAt: '2025-01-15T00:00:00.000Z'
  },
  {
    id: 'proj-desk',
    key: 'DESK',
    name: 'Operations & Service Desk',
    description: 'Incident escalation, SLAs, customer portal, and SLA breach automations.',
    leadId: 'usr-3',
    memberCount: 22,
    color: '#f59e0b',
    createdAt: '2025-01-20T00:00:00.000Z'
  }
];

export const SEED_SPRINTS: Sprint[] = [
  {
    id: 'sprint-flow-41',
    projectId: 'proj-flow',
    name: 'Sprint 41 — 1M Scale Board & Realtime SSE',
    goal: 'Virtualize board & backlog, wire edge realtime updates, verify sub-150kb bundle.',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-15T00:00:00.000Z',
    status: 'active',
    totalPoints: 68,
    completedPoints: 42
  },
  {
    id: 'sprint-flow-42',
    projectId: 'proj-flow',
    name: 'Sprint 42 — Weather Map & Graph Viz',
    goal: 'Ship Org Weather Map team health aggregator and React Flow dependency explorer.',
    startDate: '2026-03-16T00:00:00.000Z',
    endDate: '2026-03-30T00:00:00.000Z',
    status: 'future',
    totalPoints: 55,
    completedPoints: 0
  },
  {
    id: 'sprint-core-18',
    projectId: 'proj-core',
    name: 'Sprint 18 — Cursor Invalidation & Lexorank',
    goal: 'Optimize cursor token serialization and millisecond reorder ranks.',
    startDate: '2026-03-01T00:00:00.000Z',
    endDate: '2026-03-15T00:00:00.000Z',
    status: 'active',
    totalPoints: 48,
    completedPoints: 31
  }
];

export const SEED_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec-1',
    projectId: 'proj-flow',
    code: 'ADR-001',
    title: 'Adopt Next.js 15 Server Components as Default for 1M Scale',
    status: 'accepted',
    authorId: 'usr-1',
    date: '2026-01-15',
    context: 'At 1M active users, shipping client-rendered JS bundles across dozens of nested views exhausts mobile memory and causes TTI degradations beyond 4 seconds.',
    decision: 'Default all components to Server Components. Hydrate only interactive leaves via "use client".',
    consequences: 'Reduces baseline initial JS to <150KB gzipped. Requires clean server/client serialization boundaries.',
    linkedIssueIds: ['FLOW-1', 'FLOW-4']
  },
  {
    id: 'dec-2',
    projectId: 'proj-flow',
    code: 'ADR-002',
    title: 'Enforce Cursor-Based Pagination across All List APIs',
    status: 'accepted',
    authorId: 'usr-4',
    date: '2026-01-22',
    context: 'Offset pagination (?page=100) causes quadratic DB read degradation and inconsistent pagination windows when concurrent tickets are created.',
    decision: 'Strictly prohibit offset pagination. Every list endpoint returns nextCursor based on monotonic composite keys.',
    consequences: 'Deterministic latency regardless of table depth; enables smooth virtualized window scrolling.',
    linkedIssueIds: ['FLOW-2', 'FLOW-18']
  },
  {
    id: 'dec-3',
    projectId: 'proj-flow',
    code: 'ADR-003',
    title: 'Edge Server-Sent Events (SSE) for Board Updates over WebSockets',
    status: 'accepted',
    authorId: 'usr-1',
    date: '2026-02-04',
    context: 'WebSocket connections require stateful connection brokers that are expensive to run and manage on edge serverless infrastructure for mostly unidirectional board updates.',
    decision: 'Deploy an Edge-runtime SSE stream (Content-Type: text/event-stream) connecting to an internal event bus with React Query client cache patching.',
    consequences: 'Zero external SaaS costs for v1, works behind strict corporate proxies, fallback to backoff polling.',
    linkedIssueIds: ['FLOW-6', 'FLOW-12']
  }
];

export const SEED_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-1',
    projectId: 'proj-flow',
    name: 'Auto-Close Linked Epics upon Subtask Completion',
    description: 'When all child stories of an epic enter "done", mark the epic as "in_review" and alert tech lead.',
    trigger: 'STATUS_CHANGED',
    condition: 'target.status === "done" && children.all(s => s.status === "done")',
    action: 'updateIssue(epicId, { status: "in_review" })',
    enabled: true,
    executionCount: 1420,
    lastRunAt: '2026-03-12T14:23:10.000Z'
  },
  {
    id: 'auto-2',
    projectId: 'proj-flow',
    name: 'Flag Stale Blockers to Incident Channel',
    description: 'If a blocker relationship remains unresolved for >48 hours in active sprint, escalate priority to urgent.',
    trigger: 'BLOCKER_ADDED',
    condition: 'issue.priority === "urgent" || issue.blockedDurationHours > 48',
    action: 'notifySlack("#flowline-war-room", issue)',
    enabled: true,
    executionCount: 89,
    lastRunAt: '2026-03-13T09:12:44.000Z'
  }
];
