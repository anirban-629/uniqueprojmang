import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { tenancyPlugin } from './modules/tenancy/tenancy.plugin.js';
import { issuesRoutes } from './modules/issues/issues.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { sprintsRoutes } from './modules/sprints/sprints.routes.js';
import { commentsRoutes } from './modules/comments/comments.routes.js';
import { automationRoutes } from './modules/automation/automation.routes.js';
import { storageRoutes } from './modules/storage/storage.routes.js';
import { realtimeRoutes } from './modules/realtime/realtime.routes.js';
import { orgRoutes } from './modules/org/org.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { decisionsRoutes } from './modules/decisions/decisions.routes.js';

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
        title: 'Flowline Standalone Backend API',
        description: 'Independent, multi-tenant API running on Fastify. Built for ~100 independent companies on 100% free resources ($0/month) with Row-Level Security, cursor pagination, and zero cloud Docker overhead.',
        version: '1.0.0'
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Local Standalone Backend' }
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
    service: '@flowline/api',
    port: 4000,
    cost: '$0/month',
    uptime: process.uptime()
  }));

  // 6. Domain Routes
  await server.register(issuesRoutes);
  await server.register(projectsRoutes);
  await server.register(sprintsRoutes);
  await server.register(commentsRoutes);
  await server.register(automationRoutes);
  await server.register(storageRoutes);
  await server.register(realtimeRoutes);
  await server.register(orgRoutes);
  await server.register(usersRoutes);
  await server.register(decisionsRoutes);

  // 7. Start Listening
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`\n⚡ Flowline Standalone API running at: http://localhost:${port}`);
    console.log(`📖 Interactive Swagger UI at:         http://localhost:${port}/docs\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
