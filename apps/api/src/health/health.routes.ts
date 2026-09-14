import { FastifyPluginAsync } from 'fastify';
import { getHealth } from './health.controller.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  const schema = {
    tags: ['System & Health'],
    summary: 'Comprehensive System & Infrastructure Health Check',
    description: 'Performs live, non-destructive connectivity verification against Supabase Postgres, Supabase Storage, and Upstash Redis.'
  };

  fastify.get('/health', { schema }, getHealth);
  fastify.get('/api/health', { schema: { ...schema, summary: 'Comprehensive System & Infrastructure Health Check (API Prefix)' } }, getHealth);
};
