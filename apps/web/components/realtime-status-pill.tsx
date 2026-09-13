'use client';

import React from 'react';
import { useRealtimeUpdates } from '@flowline/hooks';
import { Radio } from 'lucide-react';

export function RealtimeStatusPill({ projectId = 'proj-flow' }: { projectId?: string }) {
  const { status, lastEvent } = useRealtimeUpdates(projectId);

  const statusConfig = {
    connected: {
      color: 'bg-emerald-500',
      text: 'text-emerald-400',
      label: 'Live (SSE)'
    },
    connecting: {
      color: 'bg-amber-500 animate-pulse',
      text: 'text-amber-400',
      label: 'Connecting'
    },
    reconnecting: {
      color: 'bg-amber-500 animate-pulse',
      text: 'text-amber-400',
      label: 'Reconnecting'
    },
    offline: {
      color: 'bg-rose-500',
      text: 'text-rose-400',
      label: 'Offline (Polling)'
    }
  }[status];

  return (
    <div
      title={lastEvent ? `Last event: ${lastEvent.type} at ${new Date(lastEvent.timestamp).toLocaleTimeString()}` : 'Realtime streaming active via Edge SSE'}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm select-none"
    >
      <span className={`h-2 w-2 rounded-full ${statusConfig.color}`} />
      <span className={statusConfig.text}>{statusConfig.label}</span>
    </div>
  );
}
