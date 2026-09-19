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

export interface TenancyContext {
  tenantId: string;
  companyId: string;
  companyName: string;
  plan: 'free' | 'pro' | 'enterprise';
  roles: string[];
}

export interface DomainEvent<T = Record<string, unknown>> {
  eventId: string;
  tenantId: string;
  eventName: string;
  occurredAt: string;
  payload: T;
}

export interface IssueCreatedEventPayload {
  issueId: string;
  key: string;
  projectId: string;
  reporterId: string;
  assigneeId?: string;
  title: string;
}

export interface IssueUpdatedEventPayload {
  issueId: string;
  key: string;
  projectId: string;
  changes: {
    status?: { from: IssueStatus; to: IssueStatus };
    priority?: { from: IssuePriority; to: IssuePriority };
    assigneeId?: { from?: string; to?: string };
    sprintId?: { from?: string; to?: string };
  };
}

export type TenantRole = 'owner' | 'admin' | 'member' | 'billing_manager' | 'viewer' | 'guest';
export type ProjectRole = 'lead' | 'contributor' | 'reporter' | 'viewer' | 'guest';
export type MemberStatus = 'active' | 'invited' | 'suspended';

export type PermissionKey =
  // Tenant Level
  | 'tenant.view'
  | 'tenant.update'
  | 'tenant.delete'
  | 'members.view'
  | 'members.manage'
  | 'members.remove'
  | 'billing.manage'
  | 'projects.create'
  | 'invitations.create'
  // Project Level
  | 'project.view'
  | 'project.update'
  | 'project.archive'
  | 'project.delete'
  | 'project.manage_members'
  | 'issue.create'
  | 'issue.view'
  | 'issue.edit.own'
  | 'issue.edit.any'
  | 'issue.delete.own'
  | 'issue.delete.any'
  | 'comment.create'
  | 'comment.delete.own'
  | 'comment.delete.any';

export interface PermissionRecord {
  id: string;
  key: PermissionKey;
  description: string;
  scope: 'tenant' | 'project';
  createdAt?: string;
}

export interface TenantRoleRecord {
  id: string;
  tenantId: string | null;
  name: TenantRole | string;
  description?: string;
  isSystem: boolean;
  permissions?: PermissionKey[];
  createdAt?: string;
}

export interface ProjectRoleRecord {
  id: string;
  tenantId: string | null;
  name: ProjectRole | string;
  description?: string;
  isSystem: boolean;
  permissions?: PermissionKey[];
  createdAt?: string;
}

export interface ResolvedPermissions {
  userId: string;
  tenantId: string;
  projectId?: string;
  tenantRole: TenantRole | string;
  projectRole?: ProjectRole | string;
  permissions: PermissionKey[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  tenantRoleId?: string;
  status: MemberStatus;
  invitedAt?: string;
  joinedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'pending_verification';
  emailVerifiedAt?: string;
  createdAt: string;
}

export type AuthAuditAction = 
  | 'login' 
  | 'failed_login' 
  | 'logout' 
  | 'logout_all' 
  | 'register' 
  | 'switch_tenant' 
  | 'invite_sent' 
  | 'invite_accepted' 
  | 'password_changed'
  | 'role_changed'
  | 'member_removed';

export interface UserRegisteredEventPayload {
  userId: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: TenantRole;
}

export interface UserLoggedInEventPayload {
  userId: string;
  email: string;
  tenantId: string;
  ip?: string;
}

export interface TenantCreatedEventPayload {
  tenantId: string;
  name: string;
  slug: string;
  ownerId: string;
}

export interface MemberInvitedEventPayload {
  tenantId: string;
  email: string;
  role: TenantRole;
  invitedBy: string;
}

export interface MemberRoleChangedEventPayload {
  tenantId: string;
  targetUserId: string;
  actorUserId: string;
  oldRole: string;
  newRole: string;
  projectId?: string;
}

// Unified Auth Request / Response DTOs
export interface RegisterRequestPayload {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationSlug?: string;
  tenantName?: string; // Backward compatibility alias
}

export interface LoginRequestPayload {
  email: string;
  password: string;
}

export interface ResetPasswordRequestPayload {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordRequestPayload {
  email: string;
}

export interface SwitchTenantRequestPayload {
  targetTenantId: string;
}

export interface InviteUserRequestPayload {
  email: string;
  role: TenantRole;
}

export interface AcceptInviteRequestPayload {
  token: string;
  password?: string;
  fullName?: string;
}

export interface InviteDetailsResponse {
  email: string;
  role: TenantRole;
  tenantName: string;
  tenantSlug: string;
  inviterName?: string;
  expiresAt: string;
  isValid: boolean;
}

export interface TenantMembershipDto {
  tenantId: string;
  companyId: string;
  name: string;
  slug: string;
  role: TenantRole | string;
}

export interface AuthSessionResponse {
  user: User | AuthUser;
  tenant: {
    userId: string;
    tenantId: string;
    companyId: string;
    role: TenantRole | string;
    permissions?: PermissionKey[] | string[];
    email?: string;
  };
  memberships: TenantMembershipDto[];
}
