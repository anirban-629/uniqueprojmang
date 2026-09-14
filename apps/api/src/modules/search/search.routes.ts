import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

export const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/search/issues', {
    schema: {
      tags: ['Search'],
      summary: 'Full-Text & Fuzzy Issue Search (Postgres tsvector/pg_trgm Wrapper)',
      description: 'Native search interface abstracting full-text tsvector and fuzzy matching.',
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string' },
          projectId: { type: 'string', default: 'proj-flow' },
          limit: { type: 'integer', default: 20 }
        }
      }
    }
  }, async (request) => {
    const { q, projectId = 'proj-flow', limit = 20 } = request.query as any;
    await mockDb.simulateNetwork();

    // Query through mockDb text filter, simulating tsvector & trigram ranked results
    const results = mockDb.queryIssues({
      projectId,
      search: q,
      limit: Number(limit)
    });

    return {
      query: q,
      engine: 'postgres-native (tsvector + pg_trgm)',
      totalMatches: results.data.length,
      results: results.data
    };
  });
};
