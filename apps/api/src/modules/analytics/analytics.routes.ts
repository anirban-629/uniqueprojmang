import { FastifyPluginAsync } from 'fastify';
import * as controller from './analytics.controller.js';
import * as schemas from './analytics.schema.js';
import { GetWeatherMapRoute, GetVelocityRoute } from './analytics.types.js';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<GetWeatherMapRoute>('/api/analytics/weather-map', { schema: schemas.weatherMapSchema }, controller.getWeatherMap);
  fastify.get<GetWeatherMapRoute>('/api/org/weather-map', { schema: schemas.legacyWeatherMapSchema }, controller.getWeatherMap);
  fastify.get<GetVelocityRoute>('/api/analytics/velocity', { schema: schemas.velocitySchema }, controller.getVelocity);
};
