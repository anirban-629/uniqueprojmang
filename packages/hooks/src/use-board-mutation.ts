import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Issue, IssueStatus } from '@flowline/types';

interface UpdateIssueVariables {
  id: string;
  projectId: string;
  status?: IssueStatus;
  rank?: string;
  sprintId?: string | null;
  assigneeId?: string;
  priority?: Issue['priority'];
  title?: string;
  description?: string;
}

export function useBoardMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: UpdateIssueVariables): Promise<Issue> => {
      const res = await fetch(`/api/issues/${variables.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variables)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server responded with ${res.status}`);
      }
      return res.json();
    },

    // Optimistic Update: instantly update React Query cache before network responds
    onMutate: async (newValues) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['issues'] });

      // Snapshot previous infinite queries
      const previousQueries = queryClient.getQueriesData({ queryKey: ['issues'] });

      // Optimistically update all matching infinite query caches
      queryClient.setQueriesData({ queryKey: ['issues'] }, (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((issue: Issue) => {
              if (issue.id === newValues.id) {
                return {
                  ...issue,
                  status: newValues.status ?? issue.status,
                  rank: newValues.rank ?? issue.rank,
                  sprintId: newValues.sprintId !== undefined ? newValues.sprintId : issue.sprintId,
                  assigneeId: newValues.assigneeId ?? issue.assigneeId,
                  priority: newValues.priority ?? issue.priority,
                  updatedAt: new Date().toISOString()
                };
              }
              return issue;
            })
          }))
        };
      });

      // Also update single issue cache if present
      queryClient.setQueryData(['issue', newValues.id], (old: Issue | undefined) => {
        if (!old) return old;
        return {
          ...old,
          ...newValues,
          updatedAt: new Date().toISOString()
        };
      });

      return { previousQueries };
    },

    // If mutation fails, roll back to snapshot!
    onError: (_err, _newValues, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    // Once settled, softly invalidate to ensure fresh server reconciliation
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['issues'],
        exact: false,
        refetchType: 'active'
      });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['issue', variables.id] });
      }
    }
  });
}
