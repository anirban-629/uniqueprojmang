import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeEvent, Issue } from '@flowline/types';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export function useRealtimeUpdates(projectId: string) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!projectId || typeof window === 'undefined') return;

    let isUnmounted = false;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      if (isUnmounted) return;
      setStatus(retryCountRef.current > 0 ? 'reconnecting' : 'connecting');

      const url = `/api/realtime?projectId=${encodeURIComponent(projectId)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (isUnmounted) return;
        setStatus('connected');
        retryCountRef.current = 0;
      };

      es.onmessage = (e) => {
        if (isUnmounted) return;
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          setLastEvent(event);

          if (event.type === 'ISSUE_MOVED' || event.type === 'ISSUE_UPDATED') {
            const updatedIssue = event.payload as Issue;
            // Patch TanStack Query cache directly without causing a janky full-page reload
            queryClient.setQueriesData({ queryKey: ['issues'] }, (oldData: any) => {
              if (!oldData || !oldData.pages) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  data: page.data.map((item: Issue) =>
                    item.id === updatedIssue.id ? updatedIssue : item
                  )
                }))
              };
            });
            // Also invalidate single issue query if open in detail drawer
            queryClient.setQueryData(['issue', updatedIssue.id], updatedIssue);
          } else if (event.type === 'ISSUE_CREATED') {
            // Invalidate issues query so the new issue is placed correctly
            queryClient.invalidateQueries({ queryKey: ['issues'], exact: false });
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      es.onerror = () => {
        es.close();
        if (isUnmounted) return;
        setStatus('offline');

        // Exponential backoff reconnect
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 15000);
        retryCountRef.current += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      isUnmounted = true;
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [projectId, queryClient]);

  return { status, lastEvent };
}
