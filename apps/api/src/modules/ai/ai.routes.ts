import { FastifyPluginAsync } from 'fastify';
import * as controller from './ai.controller.js';
import * as schemas from './ai.schema.js';
import { SummarizeIssueRoute, GetAIJobRoute } from './ai.types.js';

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<SummarizeIssueRoute>('/api/ai/summarize', { schema: schemas.summarizeIssueSchema }, controller.summarizeIssue);
  fastify.get<GetAIJobRoute>('/api/ai/jobs/:jobId', { schema: schemas.getAIJobSchema }, controller.getJobStatus);
};
