import { FastifyPluginAsync } from 'fastify';
import { realtimeHub } from '@flowline/mock-db';
import { RealtimeEvent } from '@flowline/types';

export const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/realtime', {
    schema: {
      tags: ['Realtime'],
      summary: 'Server-Sent Events Realtime Stream',
      description: 'Live SSE stream for real-time board mutations and updates.',
      querystring: {
        type: 'object',
        properties: { projectId: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };

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
        console.error('SSE write error:', err);
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
  });
};
