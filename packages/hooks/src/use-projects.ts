import { useQuery } from '@tanstack/react-query';
import { Project, Sprint } from '@flowline/types';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useProject(idOrKey: string) {
  return useQuery({
    queryKey: ['projects', idOrKey],
    queryFn: async (): Promise<Project> => {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(idOrKey)}`);
      if (!res.ok) throw new Error('Project not found');
      return res.json();
    },
    enabled: Boolean(idOrKey),
    staleTime: 5 * 60 * 1000
  });
}

export function useSprints(projectId?: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async (): Promise<Sprint[]> => {
      const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
      const res = await fetch(`/api/sprints${query}`);
      if (!res.ok) throw new Error('Failed to fetch sprints');
      return res.json();
    },
    enabled: Boolean(projectId),
    staleTime: 60 * 1000
  });
}
