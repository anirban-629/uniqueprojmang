import { FastifyPluginAsync } from 'fastify';
import { realtimeHub } from '@flowline/mock-db';
import { RealtimeEvent } from '@flowline/types';
import { eventBus } from '../../events/event-bus.js';

// Ephemeral in-memory presence store (Section 1.5 - kept out of Postgres)
interface PresenceUser {
  userId: string;
  userName: string;
  projectId: string;
  activeBoard: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

const PRESENCE_STORE = new Map<string, PresenceUser>();

export const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  // Listen to in-process domain events and pipe them to realtimeHub
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

  // GET /api/realtime — SSE Stream
  fastify.get('/api/realtime', {
    schema: {
      tags: ['Realtime'],
      summary: 'Server-Sent Events Realtime Stream',
      description: 'Live SSE stream for real-time board mutations, comments, and presence updates.',
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

  // POST /api/realtime/presence — Ephemeral presence heartbeat
  fastify.post('/api/realtime/presence', {
    schema: {
      tags: ['Realtime'],
      summary: 'Update Ephemeral Presence / Live Cursors',
      description: 'In-memory presence heartbeat (kept out of Postgres).',
      body: {
        type: 'object',
        required: ['userId', 'projectId'],
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
          projectId: { type: 'string' },
          activeBoard: { type: 'string' },
          cursor: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' } }
          }
        }
      }
    }
  }, async (request) => {
    const body = request.body as PresenceUser;
    PRESENCE_STORE.set(body.userId, {
      ...body,
      lastSeen: Date.now()
    });

    // Cleanup stale presence > 30s
    const cutoff = Date.now() - 30_000;
    const active = Array.from(PRESENCE_STORE.values()).filter(p => p.lastSeen > cutoff && p.projectId === body.projectId);

    return {
      activeCollaborators: active
    };
  });
};
