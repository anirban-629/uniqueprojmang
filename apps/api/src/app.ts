import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { corsConfig } from './config/cors.config.js';
import { swaggerConfig, swaggerUiConfig } from './config/swagger.config.js';
import { tenancyPlugin, rateLimitPlugin, errorHandlerPlugin } from './plugins/index.js';
import { healthRoutes } from './health/index.js';

import { authRoutes } from './modules/auth/index.js';
import { coreRoutes } from './modules/core/index.js';
import { searchRoutes } from './modules/search/index.js';
import { realtimeRoutes } from './modules/realtime/index.js';
import { automationRoutes } from './modules/automation/index.js';
import { aiRoutes } from './modules/ai/index.js';
import { integrationsRoutes } from './modules/integrations/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        strict: false
      }
    }
  });

  // 1. Core plugins
  await app.register(cors, corsConfig);
  await app.register(swagger, swaggerConfig);
  await app.register(swaggerUi, swaggerUiConfig);

  // 2. Custom infrastructure plugins
  await app.register(tenancyPlugin);
  await app.register(rateLimitPlugin);
  await app.register(errorHandlerPlugin);

  // 3. Health check routes
  await app.register(healthRoutes);

  // 4. Domain modules
  await app.register(authRoutes);
  await app.register(coreRoutes);
  await app.register(searchRoutes);
  await app.register(realtimeRoutes);
  await app.register(automationRoutes);
  await app.register(aiRoutes);
  await app.register(integrationsRoutes);
  await app.register(analyticsRoutes);

  return app;
}
