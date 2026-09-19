import { randomUUID } from 'crypto';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { TenantContext } from '../shared/types/index.js';
import { logger } from '../shared/logger.js';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';

export type { TenantContext } from '../shared/types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    companyTenant: TenantContext;
    traceId: string;
    isAuthenticated: boolean;
  }
}

const DEFAULT_TENANT_ID = 'acme-corp';
const DEFAULT_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '10000000-0000-0000-0000-000000000001';

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
  fastify.decorateRequest('isAuthenticated', false);

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
    const headerTenantId = (request.headers['x-tenant-id'] as string) || headerCompanyId;
    const authHeader = request.headers.authorization;
    let cookieToken: string | undefined;
    if (request.headers.cookie) {
      const match = request.headers.cookie.match(/(?:flowline_session|access_token)=([^;]+)/);
      if (match) {
        cookieToken = decodeURIComponent(match[1]);
      }
    }

    let verifiedUserId: string | null = null;
    let verifiedTenantId: string | null = null;
    let verifiedCompanyId: string | null = null;
    let verifiedRole: string = 'tech_lead';
    let isAuthenticated = false;

    // 2. JWT Verification
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : cookieToken;

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        verifiedUserId = decoded.sub;
        verifiedTenantId = decoded.tenant_id;
        verifiedCompanyId = decoded.company_id;
        verifiedRole = decoded.role;
        isAuthenticated = true;
      } catch (err: any) {
        request.log.debug({ err: err.message }, 'JWT token verification failed or revoked');
      }
    }

    const tenantId = verifiedTenantId || headerTenantId || DEFAULT_TENANT_ID;
    const companyId = verifiedCompanyId || headerCompanyId || DEFAULT_COMPANY_ID;
    const userId = verifiedUserId || (request.headers['x-flowline-user-id'] as string) || DEFAULT_USER_ID;

    request.isAuthenticated = isAuthenticated;
    request.companyTenant = {
      tenantId,
      companyId,
      userId,
      role: verifiedRole as any
    };

    // 3. Child request logger with tenant, user and trace context
    request.log = logger.child({
      tenantId,
      companyId,
      userId,
      traceId,
      authenticated: isAuthenticated
    });
  });
};

export const tenancyPlugin = fp(tenancyPluginAsync, {
  name: 'flowline-tenancy'
});
