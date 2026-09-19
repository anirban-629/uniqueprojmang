import { cookies } from 'next/headers';
import { 
  Project, 
  CreateProjectPayload,
  Sprint, 
  CreateSprintPayload,
  User, 
  Issue, 
  IssuesQueryParams, 
  PaginatedResponse, 
  Comment, 
  OrgWeatherMapSummary, 
  DecisionRecord, 
  AutomationRule 
} from '@flowline/types';

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchFromApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let cookieHeader = '';
  try {
    const cookieStore = await cookies();
    cookieHeader = cookieStore.toString();
  } catch {
    // Invoked in client component or outside request scope
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...(options?.headers || {})
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 404) return null as unknown as T;
      throw new Error(`API Error [${res.status}] ${res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn(`[Flowline API Client] Request error for ${url}:`, err.message);
    return (path.includes('?') || path.endsWith('s') ? [] : null) as unknown as T;
  }
}

export const apiClient = {
  async getProjects(): Promise<Project[]> {
    const data = await fetchFromApi<Project[]>('/api/projects');
    return Array.isArray(data) ? data : [];
  },

  async getProject(id: string): Promise<Project | null> {
    return await fetchFromApi<Project>(`/api/projects/${encodeURIComponent(id)}`);
  },

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    return await fetchFromApi<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getSprints(projectId?: string): Promise<Sprint[]> {
    const data = await fetchFromApi<Sprint[]>(`/api/sprints${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  async createSprint(payload: CreateSprintPayload): Promise<Sprint> {
    return await fetchFromApi<Sprint>('/api/sprints', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getUsers(): Promise<User[]> {
    const data = await fetchFromApi<User[]>('/api/users');
    return Array.isArray(data) ? data : [];
  },

  async queryIssues(params: IssuesQueryParams): Promise<PaginatedResponse<Issue>> {
    const query = new URLSearchParams();
    if (params.projectId) query.set('projectId', params.projectId);
    if (params.status) query.set('status', params.status);
    if (params.sprintId) query.set('sprintId', params.sprintId);
    if (params.assigneeId) query.set('assigneeId', params.assigneeId);
    if (params.priority) query.set('priority', params.priority);
    if (params.type) query.set('type', params.type);
    if (params.search) query.set('search', params.search);
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetchFromApi<PaginatedResponse<Issue>>(`/api/issues?${query.toString()}`);
    return res || { data: [], nextCursor: null, meta: { serverTime: Date.now(), latencyMs: 0 } };
  },

  async getIssue(id: string): Promise<(Issue & { comments?: Comment[] }) | null> {
    return await fetchFromApi<Issue & { comments?: Comment[] }>(`/api/issues/${encodeURIComponent(id)}`);
  },

  async createIssue(payload: any): Promise<Issue> {
    return await fetchFromApi<Issue>('/api/issues', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateIssue(id: string, updates: any): Promise<Issue> {
    return await fetchFromApi<Issue>(`/api/issues/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async getComments(issueId: string): Promise<Comment[]> {
    const data = await fetchFromApi<Comment[]>(`/api/comments?issueId=${encodeURIComponent(issueId)}`);
    return Array.isArray(data) ? data : [];
  },

  async addComment(issueId: string, body: string): Promise<Comment> {
    return await fetchFromApi<Comment>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ issueId, body })
    });
  },

  async getWeatherMapSummaries(): Promise<OrgWeatherMapSummary[]> {
    const data = await fetchFromApi<OrgWeatherMapSummary[]>('/api/org/weather-map');
    return Array.isArray(data) ? data : [];
  },

  async getDecisions(projectId: string): Promise<DecisionRecord[]> {
    const data = await fetchFromApi<DecisionRecord[]>(`/api/decisions?projectId=${encodeURIComponent(projectId)}`);
    return Array.isArray(data) ? data : [];
  },

  async getAutomations(projectId: string): Promise<AutomationRule[]> {
    const data = await fetchFromApi<AutomationRule[]>(`/api/automation?projectId=${encodeURIComponent(projectId)}`);
    return Array.isArray(data) ? data : [];
  }
};
