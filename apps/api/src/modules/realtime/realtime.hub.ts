import { RealtimeEvent } from '@flowline/types';

export type RealtimeSubscriber = (event: RealtimeEvent) => void;

export class RealtimeHub {
  private subscribers = new Set<RealtimeSubscriber>();

  public subscribe(subscriber: RealtimeSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  public publish(event: RealtimeEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch {
        // Safe dispatch failure boundary
      }
    }
  }

  public getSubscriberCount(): number {
    return this.subscribers.size;
  }
}

export const realtimeHub = new RealtimeHub();
