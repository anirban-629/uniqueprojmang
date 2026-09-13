import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Issue, IssuesQueryParams, PaginatedResponse } from '@flowline/types';

async function fetchIssuesPage(params: IssuesQueryParams & { cursor?: string | null }): Promise<PaginatedResponse<Issue>> {
  const query = new URLSearchParams();
  if (params.projectId) query.set('projectId', params.projectId);
  if (params.status) query.set('status', params.status);
  if (params.sprintId !== undefined) query.set('sprintId', params.sprintId);
  if (params.assigneeId) query.set('assigneeId', params.assigneeId);
  if (params.priority) query.set('priority', params.priority);
  if (params.type) query.set('type', params.type);
  if (params.search) query.set('search', params.search);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`/api/issues?${query.toString()}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch issues: ${res.status} ${errorText}`);
  }
  return res.json();
}

export function useInfiniteIssues(params: Omit<IssuesQueryParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: ['issues', 'infinite', params],
    queryFn: ({ pageParam }) => fetchIssuesPage({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000 // 30 seconds
  });
}

export function useIssueDetail(idOrKey: string) {
  return useQuery({
    queryKey: ['issue', idOrKey],
    queryFn: async (): Promise<Issue> => {
      const res = await fetch(`/api/issues/${idOrKey}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch issue: ${res.status}`);
      }
      return res.json();
    },
    enabled: Boolean(idOrKey),
    staleTime: 60 * 1000
  });
}
