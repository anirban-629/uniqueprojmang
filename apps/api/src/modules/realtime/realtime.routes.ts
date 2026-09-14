import { FastifyPluginAsync } from 'fastify';
import * as controller from './realtime.controller.js';
import * as schemas from './realtime.schema.js';
import { registerRealtimeEventListeners } from './realtime.events.js';
import { RealtimeStreamRoute, UpdatePresenceRoute } from './realtime.types.js';

export const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  // Register in-process event subscriptions once
  registerRealtimeEventListeners();

  fastify.get<RealtimeStreamRoute>('/api/realtime', { schema: schemas.realtimeStreamSchema }, controller.handleRealtimeStream);
  fastify.post<UpdatePresenceRoute>('/api/realtime/presence', { schema: schemas.updatePresenceSchema }, controller.updatePresence);
};
