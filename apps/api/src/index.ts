import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { tenancyPlugin, authRoutes } from './modules/auth/index.js';
import { coreRoutes } from './modules/core/index.js';
import { searchRoutes } from './modules/search/index.js';
import { realtimeRoutes } from './modules/realtime/index.js';
import { automationRoutes } from './modules/automation/index.js';
import { aiRoutes } from './modules/ai/index.js';
import { integrationsRoutes } from './modules/integrations/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';

const server = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strict: false
    }
  }
});

async function main() {
  // 1. CORS
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // 2. Swagger / OpenAPI 3.0 Specification
  await server.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Flowline Modular Backend API (Free-Tier Monolith)',
        description: 'Migration-ready modular monolith built for ~100 independent companies on 100% free resources ($0/month) with Row-Level Security, bounded domain modules, and in-process event bus.',
        version: '1.0.0'
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Local Modular Monolith' }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT authentication token.'
          },
          CompanyTenantHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'x-company-id',
            description: 'Tenant isolation key (defaults to Acme Corp if omitted).'
          }
        }
      },
      security: [{ BearerAuth: [], CompanyTenantHeader: [] }]
    }
  });

  // 3. Swagger UI served at /docs
  await server.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // 4. Multi-Tenant Context & Rate Limiting Plugin
  await server.register(tenancyPlugin);

  // 5. Health Check
  server.get('/health', async () => ({
    status: 'ok',
    service: '@flowline/api (modular monolith)',
    port: 4000,
    cost: '$0/month',
    uptime: process.uptime()
  }));

  // 6. Register 8 Domain Modules
  await server.register(authRoutes);
  await server.register(coreRoutes);
  await server.register(searchRoutes);
  await server.register(realtimeRoutes);
  await server.register(automationRoutes);
  await server.register(aiRoutes);
  await server.register(integrationsRoutes);
  await server.register(analyticsRoutes);

  // 7. Start Server
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`\n⚡ Flowline Modular Backend running at: http://localhost:${port}`);
    console.log(`📖 Interactive Swagger UI at:          http://localhost:${port}/docs\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
