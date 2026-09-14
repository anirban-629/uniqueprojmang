import { FastifyPluginAsync } from 'fastify';
import * as controller from './search.controller.js';
import * as schemas from './search.schema.js';
import { SearchIssuesRoute } from './search.types.js';

export const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<SearchIssuesRoute>('/api/search/issues', { schema: schemas.searchIssuesSchema }, controller.searchIssues);
};
