export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

export type IssueType = 'story' | 'bug' | 'task' | 'epic';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'tech_lead' | 'engineer' | 'product_manager' | 'designer';
  teamId: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  leadId: string;
  memberCount: number;
  icon?: string;
  color: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'future' | 'active' | 'closed';
  totalPoints?: number;
  completedPoints?: number;
}

export interface Issue {
  id: string;
  key: string; // e.g. "FLOW-10492"
  projectId: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  assigneeId?: string;
  reporterId: string;
  sprintId?: string;
  storyPoints?: number;
  rank: string; // Lexorank or monotonic lexicographical string for order
  labels: string[];
  createdAt: string;
  updatedAt: string;
  blockerIds?: string[]; // IDs this issue blocks
  blockedByIds?: string[]; // IDs this issue is blocked by
  decisionIds?: string[];
}

export interface Comment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  issueId: string;
  userId: string;
  type: 'status_change' | 'comment' | 'assignment' | 'priority_change' | 'created';
  oldValue?: string;
  newValue?: string;
  content?: string;
  createdAt: string;
}

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  totalEstimate?: number;
  meta: {
    serverTime: number;
    latencyMs: number;
    cached?: boolean;
  };
}

export interface IssuesQueryParams extends CursorPaginationParams {
  projectId: string;
  status?: IssueStatus;
  sprintId?: string;
  assigneeId?: string;
  priority?: IssuePriority;
  type?: IssueType;
  search?: string;
  label?: string;
}

export interface OrgWeatherMapSummary {
  teamId: string;
  teamName: string;
  leadName: string;
  velocityTrend: 'up' | 'down' | 'stable';
  velocityChangePct: number;
  staleTicketPct: number;
  blockerCount: number;
  healthScore: number; // 0 - 100
  activeSprintName: string;
  totalOpenIssues: number;
  cycleTimeDays: number;
}

export interface DecisionRecord {
  id: string;
  projectId: string;
  code: string; // ADR-001
  title: string;
  status: 'proposed' | 'accepted' | 'superseded' | 'rejected';
  authorId: string;
  date: string;
  context: string;
  decision: string;
  consequences: string;
  linkedIssueIds: string[];
}

export interface AutomationRule {
  id: string;
  projectId: string;
  name: string;
  description: string;
  trigger: 'STATUS_CHANGED' | 'ISSUE_CREATED' | 'BLOCKER_ADDED';
  condition: string;
  action: string;
  enabled: boolean;
  executionCount: number;
  lastRunAt?: string;
}

export type RealtimeEventType = 
  | 'ISSUE_CREATED' 
  | 'ISSUE_UPDATED' 
  | 'ISSUE_MOVED' 
  | 'ISSUE_DELETED'
  | 'SPRINT_UPDATED'
  | 'DECISION_LOGGED';

export interface RealtimeEvent<T = any> {
  id: string;
  type: RealtimeEventType;
  projectId: string;
  timestamp: number;
  payload: T;
}
