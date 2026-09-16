import { eventBus } from '../../shared/event-bus.js';
import { realtimeHub } from './realtime.hub.js';

export function registerRealtimeEventListeners(): void {
  eventBus.subscribe('issue:updated', (event) => {
    realtimeHub.publish({
      id: event.eventId,
      type: 'ISSUE_UPDATED',
      projectId: (event.payload as any).projectId || 'proj-flow',
      timestamp: Date.now(),
      payload: event.payload
    });
  });

  eventBus.subscribe('issue:created', (event) => {
    realtimeHub.publish({
      id: event.eventId,
      type: 'ISSUE_CREATED',
      projectId: (event.payload as any).projectId || 'proj-flow',
      timestamp: Date.now(),
      payload: event.payload
    });
  });
}
