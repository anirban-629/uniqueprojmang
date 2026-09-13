import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const decisionsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/decisions', {
    schema: {
      tags: ['Decisions'],
      summary: 'List Architectural Decision Records (ADR)',
      querystring: {
        type: 'object',
        properties: {
          projectId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };
    const decisions = mockDb.getDecisions(projectId || 'proj-flow');
    return reply.send(decisions);
  });
};
