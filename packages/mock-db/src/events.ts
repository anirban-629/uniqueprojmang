import { RealtimeEvent } from '@flowline/types';

type Listener = (event: RealtimeEvent) => void;

class RealtimeHub {
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public publish(event: RealtimeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error dispatching realtime event:', err);
      }
    }
  }

  public listenerCount(): number {
    return this.listeners.size;
  }
}

// Global singleton across hot reloads in dev
const globalForEvents = globalThis as unknown as { flowlineRealtimeHub?: RealtimeHub };

export const realtimeHub = globalForEvents.flowlineRealtimeHub || new RealtimeHub();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.flowlineRealtimeHub = realtimeHub;
}
