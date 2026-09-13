import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const orgRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/org/weather-map', {
    schema: {
      tags: ['Org'],
      summary: 'Get Org Weather Map Summary',
      description: 'Pre-aggregated cross-team velocity, blocker count, and health scores.',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teamId: { type: 'string' },
              teamName: { type: 'string' },
              leadName: { type: 'string' },
              velocityTrend: { type: 'string' },
              velocityChangePct: { type: 'number' },
              staleTicketPct: { type: 'number' },
              blockerCount: { type: 'integer' },
              healthScore: { type: 'number' },
              activeSprintName: { type: 'string' },
              totalOpenIssues: { type: 'integer' },
              cycleTimeDays: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (_request, reply) => {
    await mockDb.simulateNetwork();
    const summaries = mockDb.getWeatherMapSummaries();
    return reply.send(summaries);
  });
};
