import {
  Issue,
  IssueStatus,
  IssuePriority,
  IssueType,
  Project,
  Sprint,
  User,
  DecisionRecord,
  AutomationRule,
  OrgWeatherMapSummary,
  IssuesQueryParams,
  PaginatedResponse,
  Activity,
  Comment
} from '@flowline/types';
import {
  SEED_PROJECTS,
  SEED_USERS,
  SEED_SPRINTS,
  SEED_DECISIONS,
  SEED_AUTOMATIONS
} from './seed-data';
import { realtimeHub } from './events';

const TITLE_TEMPLATES = [
  'Virtualize column rendering for high-volume Kanban cards',
  'Optimize cursor pagination token decoding and index scan',
  'Implement optimistic drag-and-drop state reconciliation',
  'Mitigate hydration mismatch in Server Component boundary',
  'Edge SSE connection reconnection with exponential backoff',
  'Pre-aggregate Org Weather Map metrics to cut client payload',
  'Audit dynamic chunk splitting for Recharts and React Flow',
  'Enforce sub-150KB gzipped initial JS bundle budget in CI',
  'Fix race condition during concurrent ticket status transition',
  'Refactor TanStack Query cache invalidation for sprint switch',
  'Add Lexorank fractioning when cards are dropped between twins',
  'Implement rate-limiting backoff headers (429 Too Many Requests)',
  'Memory leak profile in long-lived EventSource stream listeners',
  'Support keyboard navigation (J/K/Enter) across virtualized backlog',
  'Add breadcrumb telemetry for Core Web Vitals (LCP, INP, CLS)',
  'Zero-trust edge session validation in Next.js middleware',
  'Interactive dependency graph neighborhood expansion algorithm',
  'Fix stale closure in useBoardMutation optimistic rollback',
  'Compress WebSocket/SSE payloads with binary or compact delta',
  'Add Architectural Decision Record (ADR) inline cross-linking'
];

const LABELS_POOL = [
  'perf', 'architecture', 'scale', 'frontend', 'backend', 'edge',
  'virtualization', 'security', 'ux', 'dx', 'p0-blocker', 'v1.0'
];

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low'];
const TYPES: IssueType[] = ['story', 'bug', 'task', 'epic'];
const STATUSES: IssueStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

class MockDatabase {
  private projects: Map<string, Project> = new Map();
  private users: Map<string, User> = new Map();
  private sprints: Map<string, Sprint> = new Map();
  private decisions: Map<string, DecisionRecord[]> = new Map();
  private automations: Map<string, AutomationRule[]> = new Map();
  private comments: Map<string, Comment[]> = new Map();
  private activities: Map<string, Activity[]> = new Map();

  // Primary store: 50,000+ issues
  public issuesById: Map<string, Issue> = new Map();
  // Secondary indices for O(1) / fast slice lookup
  public issuesByProject: Map<string, Issue[]> = new Map();

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // Load initial seed data
    SEED_PROJECTS.forEach(p => this.projects.set(p.id, p));
    SEED_USERS.forEach(u => this.users.set(u.id, u));
    SEED_SPRINTS.forEach(s => this.sprints.set(s.id, s));
    
    // Decisions & Automations
    SEED_PROJECTS.forEach(p => {
      this.decisions.set(p.id, SEED_DECISIONS.filter(d => d.projectId === p.id));
      this.automations.set(p.id, SEED_AUTOMATIONS.filter(a => a.projectId === p.id));
      this.issuesByProject.set(p.id, []);
    });

    console.time('Generating 50,000+ scale mock issues');
    this.generateRealisticDataset(50000);
    console.timeEnd('Generating 50,000+ scale mock issues');

    this.initialized = true;
  }

  private generateRealisticDataset(count: number) {
    const projectKeys = ['FLOW', 'CORE', 'INFRA', 'DESK'];
    const projectMap: Record<string, string> = {
      FLOW: 'proj-flow',
      CORE: 'proj-core',
      INFRA: 'proj-infra',
      DESK: 'proj-desk'
    };

    // Distribution: 50% FLOW, 30% CORE, 12% INFRA, 8% DESK
    for (let i = 1; i <= count; i++) {
      let keyPrefix = 'FLOW';
      const rand = Math.random();
      if (rand > 0.50 && rand <= 0.80) keyPrefix = 'CORE';
      else if (rand > 0.80 && rand <= 0.92) keyPrefix = 'INFRA';
      else if (rand > 0.92) keyPrefix = 'DESK';

      const projectId = projectMap[keyPrefix];
      const issueKey = `${keyPrefix}-${i}`;
      const id = `iss-${keyPrefix.toLowerCase()}-${i}`;

      const titleTemplate = TITLE_TEMPLATES[i % TITLE_TEMPLATES.length];
      const title = `${titleTemplate} (${issueKey})`;

      // Sprints: first 150 items of FLOW go into active sprint 41 or 42
      let sprintId: string | undefined = undefined;
      let status: IssueStatus = 'backlog';

      if (keyPrefix === 'FLOW' && i <= 90) {
        sprintId = 'sprint-flow-41';
        // Distribute across board columns
        const boardStatuses: IssueStatus[] = ['todo', 'in_progress', 'in_review', 'done'];
        status = boardStatuses[i % boardStatuses.length];
      } else if (keyPrefix === 'FLOW' && i <= 150) {
        sprintId = 'sprint-flow-42';
        status = 'todo';
      } else if (keyPrefix === 'CORE' && i <= 60) {
        sprintId = 'sprint-core-18';
        const coreStatuses: IssueStatus[] = ['todo', 'in_progress', 'done'];
        status = coreStatuses[i % coreStatuses.length];
      } else {
        // Backlog items have mostly backlog status or occasional done
        status = (i % 25 === 0) ? 'done' : 'backlog';
      }

      const priority = PRIORITIES[i % PRIORITIES.length];
      const type = TYPES[i % TYPES.length];
      const assignee = SEED_USERS[i % SEED_USERS.length];
      const reporter = SEED_USERS[(i + 1) % SEED_USERS.length];
      const storyPoints = [1, 2, 3, 5, 8, 13][i % 6];
      const rank = `0|${String(i).padStart(8, '0')}:`;

      const labels = [
        LABELS_POOL[i % LABELS_POOL.length],
        LABELS_POOL[(i + 3) % LABELS_POOL.length]
      ];

      const blockerIds = (i % 17 === 0 && i > 1) ? [`${keyPrefix}-${i - 1}`] : [];
      const blockedByIds = (i % 23 === 0 && i < count) ? [`${keyPrefix}-${i + 1}`] : [];

      const issue: Issue = {
        id,
        key: issueKey,
        projectId,
        title,
        description: `### Scope and Implementation Notes\n\nThis ticket relates to **${title}**.\n\n- **Impact:** Critical for 1M+ user concurrency.\n- **Verification:** Unit tests and virtualized viewport profiling required.\n- **Telemetry:** Must report to Sentry & Web Vitals.\n\n*Generated by Flowline Mock Database Engine.*`,
        status,
        priority,
        type,
        assigneeId: assignee.id,
        reporterId: reporter.id,
        sprintId,
        storyPoints,
        rank,
        labels,
        createdAt: new Date(Date.now() - (count - i) * 60000).toISOString(),
        updatedAt: new Date(Date.now() - (i % 60) * 60000).toISOString(),
        blockerIds,
        blockedByIds,
        decisionIds: (i % 40 === 0) ? ['dec-1'] : undefined
      };

      this.issuesById.set(id, issue);
      this.issuesByProject.get(projectId)?.push(issue);
    }
  }

  // --- Latency & Chaos Simulator ---
  public async simulateNetwork(options?: { chaos?: boolean }): Promise<number> {
    // 120ms - 280ms realistic network jitter
    const latency = Math.floor(120 + Math.random() * 160);
    await new Promise(resolve => setTimeout(resolve, latency));

    if (options?.chaos && Math.random() < 0.05) {
      const isRateLimit = Math.random() < 0.5;
      const error: any = new Error(isRateLimit ? 'Rate limit exceeded: 429 Too Many Requests' : 'Simulated 500 Internal Server Error');
      error.status = isRateLimit ? 429 : 500;
      throw error;
    }

    return latency;
  }

  // --- Query Methods ---
  public getProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  public getProject(idOrKey: string): Project | undefined {
    return (
      this.projects.get(idOrKey) ||
      Array.from(this.projects.values()).find(p => p.key.toLowerCase() === idOrKey.toLowerCase() || p.id === idOrKey)
    );
  }

  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getSprints(projectId?: string): Sprint[] {
    const list = Array.from(this.sprints.values());
    if (projectId) return list.filter(s => s.projectId === projectId);
    return list;
  }

  public getIssue(idOrKey: string): Issue | undefined {
    if (this.issuesById.has(idOrKey)) return this.issuesById.get(idOrKey);
    // Find by key
    for (const issue of this.issuesById.values()) {
      if (issue.key.toLowerCase() === idOrKey.toLowerCase()) return issue;
    }
    return undefined;
  }

  // --- Scale-Correct Cursor Pagination Query ---
  public queryIssues(params: IssuesQueryParams): PaginatedResponse<Issue> {
    const {
      projectId,
      status,
      sprintId,
      assigneeId,
      priority,
      type,
      search,
      label,
      cursor,
      limit = 50
    } = params;

    const projectIssues = this.issuesByProject.get(projectId) || [];

    // Filter in-memory
    const filtered = projectIssues.filter(issue => {
      if (status && issue.status !== status) return false;
      if (sprintId !== undefined) {
        if (sprintId === 'null' || sprintId === '') {
          if (issue.sprintId) return false;
        } else if (issue.sprintId !== sprintId) {
          return false;
        }
      }
      if (assigneeId && issue.assigneeId !== assigneeId) return false;
      if (priority && issue.priority !== priority) return false;
      if (type && issue.type !== type) return false;
      if (label && !issue.labels.includes(label)) return false;
      if (search) {
        const query = search.toLowerCase();
        if (
          !issue.title.toLowerCase().includes(query) &&
          !issue.key.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });

    // Cursor is the issue ID after which to slice
    let startIndex = 0;
    if (cursor) {
      const foundIdx = filtered.findIndex(i => i.id === cursor);
      if (foundIdx !== -1) {
        startIndex = foundIdx + 1;
      }
    }

    const pageSize = Math.min(Math.max(1, limit), 100);
    const slice = filtered.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + pageSize < filtered.length;
    const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null;

    return {
      data: slice,
      nextCursor,
      totalEstimate: filtered.length,
      meta: {
        serverTime: Date.now(),
        latencyMs: 0
      }
    };
  }

  // --- Mutations with Realtime Broadcast ---
  public updateIssue(id: string, updates: Partial<Issue>): Issue {
    const existing = this.issuesById.get(id);
    if (!existing) {
      throw new Error(`Issue not found: ${id}`);
    }

    const isStatusMove = updates.status && updates.status !== existing.status;
    const isSprintMove = updates.sprintId !== undefined && updates.sprintId !== existing.sprintId;

    const updated: Issue = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.issuesById.set(id, updated);

    // Update in project list
    const projectList = this.issuesByProject.get(existing.projectId);
    if (projectList) {
      const idx = projectList.findIndex(i => i.id === id);
      if (idx !== -1) {
        projectList[idx] = updated;
      }
    }

    // Broadcast SSE realtime event
    realtimeHub.publish({
      id: `evt-${Date.now()}`,
      type: (isStatusMove || isSprintMove) ? 'ISSUE_MOVED' : 'ISSUE_UPDATED',
      projectId: updated.projectId,
      timestamp: Date.now(),
      payload: updated
    });

    return updated;
  }

  public createIssue(data: Omit<Issue, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'rank'>): Issue {
    const project = this.projects.get(data.projectId);
    const keyPrefix = project ? project.key : 'ISS';
    const totalCount = this.issuesById.size + 1;
    const key = `${keyPrefix}-${totalCount}`;
    const id = `iss-${keyPrefix.toLowerCase()}-${totalCount}`;

    const newIssue: Issue = {
      ...data,
      id,
      key,
      rank: `0|${String(totalCount).padStart(8, '0')}:`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockerIds: data.blockerIds || [],
      blockedByIds: data.blockedByIds || []
    };

    this.issuesById.set(id, newIssue);
    this.issuesByProject.get(data.projectId)?.unshift(newIssue);

    realtimeHub.publish({
      id: `evt-${Date.now()}`,
      type: 'ISSUE_CREATED',
      projectId: newIssue.projectId,
      timestamp: Date.now(),
      payload: newIssue
    });

    return newIssue;
  }

  // --- Pre-Aggregated Org Weather Map ---
  public getWeatherMapSummaries(): OrgWeatherMapSummary[] {
    const teams = [
      { id: 'team-flow', name: 'Platform & Experience', lead: 'Elena Rostova', sprint: 'Sprint 41', projId: 'proj-flow' },
      { id: 'team-core', name: 'Sync Engine & DB Infra', lead: 'Devon Wright', sprint: 'Sprint 18', projId: 'proj-core' },
      { id: 'team-infra', name: 'Global Cloud & Edge', lead: 'Tariq Malik', sprint: 'Sprint 9', projId: 'proj-infra' },
      { id: 'team-desk', name: 'Service Desk & Escalations', lead: 'Aria Chen', sprint: 'Sprint 24', projId: 'proj-desk' }
    ];

    return teams.map((team, idx) => {
      const projectIssues = this.issuesByProject.get(team.projId) || [];
      const openIssues = projectIssues.filter(i => i.status !== 'done');
      const blockers = projectIssues.filter(i => (i.blockerIds && i.blockerIds.length > 0) || i.priority === 'urgent').length;
      
      const healthScore = Math.max(72, 98 - (blockers % 20) * 2 - (idx * 3));
      const velocityTrend: 'up' | 'down' | 'stable' = idx === 1 ? 'up' : (idx === 3 ? 'down' : 'stable');

      return {
        teamId: team.id,
        teamName: team.name,
        leadName: team.lead,
        velocityTrend,
        velocityChangePct: idx === 1 ? 14.5 : (idx === 3 ? -6.2 : 2.1),
        staleTicketPct: 4.8 + idx * 1.5,
        blockerCount: Math.min(blockers, 14),
        healthScore,
        activeSprintName: team.sprint,
        totalOpenIssues: openIssues.length,
        cycleTimeDays: 3.4 + idx * 0.8
      };
    });
  }

  // --- Decisions & Automations ---
  public getDecisions(projectId: string): DecisionRecord[] {
    return this.decisions.get(projectId) || [];
  }

  public getAutomations(projectId: string): AutomationRule[] {
    return this.automations.get(projectId) || [];
  }

  // --- Comments & Activity Stream ---
  public getComments(issueId: string): Comment[] {
    if (!this.comments.has(issueId)) {
      // Seed 2 default comments
      this.comments.set(issueId, [
        {
          id: `cmt-${issueId}-1`,
          issueId,
          authorId: 'usr-1',
          body: 'Tested cursor window slicing against 50,000 items in mock-db; sub-10ms memory slice verified.',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: `cmt-${issueId}-2`,
          issueId,
          authorId: 'usr-2',
          body: 'Verified optimistic status updates. If network drops, React Query rolls back state seamlessly.',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ]);
    }
    return this.comments.get(issueId) || [];
  }

  public addComment(issueId: string, authorId: string, body: string): Comment {
    const list = this.getComments(issueId);
    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      issueId,
      authorId,
      body,
      createdAt: new Date().toISOString()
    };
    list.push(comment);
    this.comments.set(issueId, list);
    return comment;
  }
}

// Global singleton across hot module reloads in Next.js development
const globalForDb = globalThis as unknown as { flowlineMockDb?: MockDatabase };

export const mockDb = globalForDb.flowlineMockDb || new MockDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.flowlineMockDb = mockDb;
}
