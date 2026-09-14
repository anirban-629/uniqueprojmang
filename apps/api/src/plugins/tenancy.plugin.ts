import { randomUUID } from 'crypto';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { TenantContext } from '../shared/types/index.js';
import { logger } from '../shared/logger.js';

export type { TenantContext } from '../shared/types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    companyTenant: TenantContext;
    traceId: string;
  }
}

const DEFAULT_TENANT_ID = 'acme-corp';
const DEFAULT_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = 'u0000000-0000-0000-0000-000000000001';

const tenancyPluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('companyTenant', {
    getter() {
      return (this as any)._companyTenant || {
        tenantId: DEFAULT_TENANT_ID,
        companyId: DEFAULT_COMPANY_ID,
        userId: DEFAULT_USER_ID,
        role: 'tech_lead'
      };
    },
    setter(val: TenantContext) {
      (this as any)._companyTenant = val;
    }
  });

  fastify.decorateRequest('traceId', '');

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. Trace ID extraction or generation
    const headerTraceId = request.headers['x-trace-id'] as string;
    const traceId = headerTraceId || randomUUID();
    request.traceId = traceId;
    reply.header('x-trace-id', traceId);

    if (
      request.url.startsWith('/docs') ||
      request.url.startsWith('/openapi.json') ||
      request.url === '/health' ||
      request.url === '/api/health'
    ) {
      return;
    }

    const headerCompanyId = request.headers['x-company-id'] as string;
    const headerTenantId = (request.headers['x-tenant-id'] as string) || headerCompanyId || DEFAULT_TENANT_ID;
    const authHeader = request.headers.authorization;
    let tokenCompanyId: string | null = null;
    let tokenUserId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          tokenCompanyId = payload.company_id || payload.app_metadata?.company_id || null;
          tokenUserId = payload.sub || payload.user_id || null;
        }
      } catch {
        // Fallback gracefully
      }
    }

    const companyId = headerCompanyId || tokenCompanyId || DEFAULT_COMPANY_ID;
    const userId = tokenUserId || (request.headers['x-flowline-user-id'] as string) || DEFAULT_USER_ID;

    request.companyTenant = {
      tenantId: headerTenantId,
      companyId,
      userId,
      role: 'tech_lead'
    };

    // 2. Child request logger with tenant and trace context
    request.log = logger.child({
      tenantId: headerTenantId,
      companyId,
      userId,
      traceId
    });
  });
};

export const tenancyPlugin = fp(tenancyPluginAsync, {
  name: 'flowline-tenancy'
});
