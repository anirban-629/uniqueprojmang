import EventEmitter from 'events';
import { DomainEvent } from '@flowline/types';
import { createChildLogger } from './logger.js';

const logger = createChildLogger('event-bus');

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
    logger.debug({ eventName: event.eventName, eventId: event.eventId, tenantId: event.tenantId }, 'Publishing domain event');
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
        logger.error({ err, eventName, eventId: event.eventId }, `Error handling event "${eventName}"`);
      }
    });
  }
}

export const eventBus = InProcessEventBus.getInstance();
