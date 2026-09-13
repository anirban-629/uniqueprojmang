import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface TenantContext {
  companyId: string;
  userId: string;
  role: 'admin' | 'tech_lead' | 'engineer' | 'product_manager' | 'designer';
}

declare module 'fastify' {
  interface FastifyRequest {
    tenant: TenantContext;
  }
}

const DEFAULT_COMPANY_ID = 'a0000000-0000-0000-0000-000000000001'; // Acme Corp
const DEFAULT_USER_ID = 'u0000000-0000-0000-0000-000000000001'; // Alex Chen

// In-memory sliding window rate limiter fallback ($0 free tier)
const RATE_LIMIT_WINDOWS = new Map<string, number[]>();
const WINDOW_DURATION_MS = 10_000;
const MAX_REQUESTS = 100; // 100 req per 10s per tenant

const tenancyPluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('tenant', {
    getter() {
      return (this as any)._tenant || {
        companyId: DEFAULT_COMPANY_ID,
        userId: DEFAULT_USER_ID,
        role: 'tech_lead'
      };
    },
    setter(val: TenantContext) {
      (this as any)._tenant = val;
    }
  });

  fastify.addHook('onRequest', async (request: FastifyRequest, reply) => {
    // Skip rate limit & auth for Swagger docs and openapi endpoints
    if (
      request.url.startsWith('/docs') ||
      request.url.startsWith('/openapi.json') ||
      request.url === '/health'
    ) {
      return;
    }

    // 1. Extract tenant
    const headerCompanyId = request.headers['x-company-id'] as string;
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
        } else if (token.startsWith('tenant-')) {
          tokenCompanyId = token;
        }
      } catch {
        // Ignore token parse error
      }
    }

    const queryCompanyId = (request.query as any)?.companyId;
    const companyId = headerCompanyId || tokenCompanyId || queryCompanyId || DEFAULT_COMPANY_ID;
    const userId = tokenUserId || (request.headers['x-flowline-user-id'] as string) || DEFAULT_USER_ID;

    request.tenant = {
      companyId,
      userId,
      role: 'tech_lead'
    };

    // 2. Multi-tenant sliding window rate limiter
    const now = Date.now();
    const windowStart = now - WINDOW_DURATION_MS;
    let timestamps = RATE_LIMIT_WINDOWS.get(companyId) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= MAX_REQUESTS) {
      RATE_LIMIT_WINDOWS.set(companyId, timestamps);
      reply.header('x-ratelimit-limit', String(MAX_REQUESTS));
      reply.header('x-ratelimit-remaining', '0');
      reply.header('x-flowline-tenant', companyId);
      return reply.status(429).send({
        error: 'Tenant rate limit exceeded. Too many requests in 10-second window.'
      });
    }

    timestamps.push(now);
    RATE_LIMIT_WINDOWS.set(companyId, timestamps);

    reply.header('x-ratelimit-limit', String(MAX_REQUESTS));
    reply.header('x-ratelimit-remaining', String(MAX_REQUESTS - timestamps.length));
    reply.header('x-flowline-tenant', companyId);
  });
};

export const tenancyPlugin = fp(tenancyPluginAsync, {
  name: 'flowline-tenancy'
});
