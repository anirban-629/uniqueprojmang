import EventEmitter from 'events';
import { DomainEvent } from '@flowline/types';

export class InProcessEventBus {
  private emitter: EventEmitter;
  private static instance: InProcessEventBus;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): InProcessEventBus {
    if (!InProcessEventBus.instance) {
      InProcessEventBus.instance = new InProcessEventBus();
    }
    return InProcessEventBus.instance;
  }

  public publish<T = Record<string, unknown>>(event: DomainEvent<T>): void {
    setImmediate(() => {
      this.emitter.emit(event.eventName, event);
      this.emitter.emit('*', event);
    });
  }

  public subscribe<T = Record<string, unknown>>(
    eventName: string,
    handler: (event: DomainEvent<T>) => void | Promise<void>
  ): void {
    this.emitter.on(eventName, async (event: DomainEvent<T>) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Error handling event "${eventName}":`, err);
      }
    });
  }
}

export const eventBus = InProcessEventBus.getInstance();
