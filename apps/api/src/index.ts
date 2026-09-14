import 'dotenv/config';
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
import { checkDatabaseHealth } from './db/client.js';

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

  // 5. Formal Deep Health Check (Database, Supabase Storage, Redis, Memory)
  const healthHandler = async (_request: any, reply: any) => {
    const timestamp = new Date().toISOString();
    const uptimeSeconds = Math.floor(process.uptime());

    // 1. PostgreSQL Database Check
    const dbHealth = await checkDatabaseHealth();

    // 2. Supabase Storage Check
    const storageStart = Date.now();
    let storageHealth: { status: 'healthy' | 'unhealthy' | 'unconfigured'; latencyMs?: number; bucket?: string; error?: string } = {
      status: 'unconfigured'
    };

    const supabaseUrl = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'flowline-attachments';

    if (supabaseUrl && secretKey) {
      try {
        const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
          headers: {
            'apikey': secretKey,
            'Authorization': `Bearer ${secretKey}`
          }
        });
        const latencyMs = Date.now() - storageStart;
        if (res.ok) {
          storageHealth = { status: 'healthy', latencyMs, bucket };
        } else {
          storageHealth = { status: 'unhealthy', latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
        }
      } catch (err: any) {
        storageHealth = { status: 'unhealthy', latencyMs: Date.now() - storageStart, error: err.message };
      }
    }

    // 3. Upstash Redis Check (if configured)
    const redisStart = Date.now();
    let redisHealth: { status: 'healthy' | 'unhealthy' | 'unconfigured'; latencyMs?: number; error?: string } = {
      status: 'unconfigured'
    };

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        const res = await fetch(`${redisUrl}/ping`, {
          headers: {
            'Authorization': `Bearer ${redisToken}`
          }
        });
        const latencyMs = Date.now() - redisStart;
        if (res.ok) {
          redisHealth = { status: 'healthy', latencyMs };
        } else {
          redisHealth = { status: 'unhealthy', latencyMs, error: `HTTP ${res.status}` };
        }
      } catch (err: any) {
        redisHealth = { status: 'unhealthy', latencyMs: Date.now() - redisStart, error: err.message };
      }
    }

    const isHealthy = dbHealth.status === 'healthy';
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';

    const memoryUsage = process.memoryUsage();
    const payload = {
      status: overallStatus,
      timestamp,
      uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbHealth,
        storage: storageHealth,
        redis: redisHealth
      },
      system: {
        nodeVersion: process.version,
        memoryRssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10,
        memoryHeapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10
      }
    };

    return reply.status(isHealthy ? 200 : 503).send(payload);
  };

  server.get('/health', {
    schema: {
      tags: ['System & Health'],
      summary: 'Comprehensive System & Infrastructure Health Check',
      description: 'Performs live, non-destructive connectivity verification against Supabase Postgres, Supabase Storage, and Upstash Redis.'
    }
  }, healthHandler);

  server.get('/api/health', {
    schema: {
      tags: ['System & Health'],
      summary: 'Comprehensive System & Infrastructure Health Check (API Prefix)',
      description: 'Performs live, non-destructive connectivity verification against Supabase Postgres, Supabase Storage, and Upstash Redis.'
    }
  }, healthHandler);

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
