import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from './analytics.service.js';
import { GetWeatherMapRoute, GetVelocityRoute } from './analytics.types.js';

export async function getWeatherMap(
  _request: FastifyRequest<GetWeatherMapRoute>,
  reply: FastifyReply
) {
  const result = await analyticsService.getWeatherMap();
  return reply.send(result);
}

export async function getVelocity(
  _request: FastifyRequest<GetVelocityRoute>,
  reply: FastifyReply
) {
  const result = await analyticsService.getVelocityMetrics();
  return reply.send(result);
}
