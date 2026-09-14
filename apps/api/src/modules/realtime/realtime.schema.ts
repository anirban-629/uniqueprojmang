import { FastifySchema } from 'fastify';

export const realtimeStreamSchema: FastifySchema = {
  tags: ['Realtime'],
  summary: 'Server-Sent Events Realtime Stream',
  description: 'Live SSE stream for real-time board mutations, comments, and presence updates.',
  querystring: {
    type: 'object',
    properties: { projectId: { type: 'string' } }
  }
};

export const updatePresenceSchema: FastifySchema = {
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
};
