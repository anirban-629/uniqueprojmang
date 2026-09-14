import { FastifyRequest, FastifyReply } from 'fastify';
import { searchService } from './search.service.js';
import { SearchIssuesRoute } from './search.types.js';

export async function searchIssues(
  request: FastifyRequest<SearchIssuesRoute>,
  reply: FastifyReply
) {
  const result = await searchService.searchIssues(request.query);
  return reply.send(result);
}
