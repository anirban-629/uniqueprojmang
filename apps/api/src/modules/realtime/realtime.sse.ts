import { FastifyReply, FastifyRequest } from 'fastify';
import { realtimeHub } from '@flowline/mock-db';
import { RealtimeEvent } from '@flowline/types';
import { createChildLogger } from '../../shared/logger.js';

const logger = createChildLogger('realtime-sse');

export function handleSseConnection(
  request: FastifyRequest,
  reply: FastifyReply,
  projectId?: string
): void {
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no');
  reply.raw.flushHeaders();

  reply.raw.write(': flowline realtime stream connected\n\n');

  const listener = (event: RealtimeEvent) => {
    if (projectId && event.projectId !== projectId) return;
    try {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      logger.error({ err, eventId: event.id }, 'SSE write error');
    }
  };

  const unsubscribe = realtimeHub.subscribe(listener);

  const pingInterval = setInterval(() => {
    try {
      reply.raw.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
    }
  }, 15000);

  request.raw.on('close', () => {
    clearInterval(pingInterval);
    unsubscribe();
  });
}
