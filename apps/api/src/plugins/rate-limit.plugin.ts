import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private readonly windowDurationMs: number;
  private readonly maxRequests: number;

  constructor(windowDurationMs = 10_000, maxRequests = 100) {
    this.windowDurationMs = windowDurationMs;
    this.maxRequests = maxRequests;
  }

  public check(key: string): { allowed: boolean; remaining: number; limit: number } {
    const now = Date.now();
    const windowStart = now - this.windowDurationMs;
    let timestamps = this.windows.get(key) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      this.windows.set(key, timestamps);
      return { allowed: false, remaining: 0, limit: this.maxRequests };
    }

    timestamps.push(now);
    this.windows.set(key, timestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - timestamps.length,
      limit: this.maxRequests
    };
  }

  public reset(key?: string): void {
    if (key) {
      this.windows.delete(key);
    } else {
      this.windows.clear();
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

const rateLimitPluginAsync: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (
      request.url.startsWith('/docs') ||
      request.url.startsWith('/openapi.json') ||
      request.url === '/health' ||
      request.url === '/api/health'
    ) {
      return;
    }

    const companyId = request.companyTenant?.companyId || 'default-company';
    const { allowed, remaining, limit } = rateLimiter.check(companyId);

    reply.header('x-ratelimit-limit', String(limit));
    reply.header('x-ratelimit-remaining', String(remaining));
    reply.header('x-flowline-tenant', companyId);

    if (!allowed) {
      return reply.status(429).send({
        error: 'Tenant rate limit exceeded. Too many requests in 10-second window.'
      });
    }
  });
};

export const rateLimitPlugin = fp(rateLimitPluginAsync, {
  name: 'flowline-rate-limit'
});
