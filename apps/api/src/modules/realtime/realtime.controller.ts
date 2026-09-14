import { FastifyRequest, FastifyReply } from 'fastify';
import { handleSseConnection } from './realtime.sse.js';
import { realtimeService } from './realtime.service.js';
import { RealtimeStreamRoute, UpdatePresenceRoute } from './realtime.types.js';

export async function handleRealtimeStream(
  request: FastifyRequest<RealtimeStreamRoute>,
  reply: FastifyReply
) {
  handleSseConnection(request, reply, request.query.projectId);
}

export async function updatePresence(
  request: FastifyRequest<UpdatePresenceRoute>,
  reply: FastifyReply
) {
  const result = realtimeService.updatePresence(request.body);
  return reply.send(result);
}
