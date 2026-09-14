import { FastifySchema } from 'fastify';

export const searchIssuesSchema: FastifySchema = {
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
};
