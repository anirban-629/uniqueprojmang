import { FastifyRequest, FastifyReply } from 'fastify';
import { aiService } from './ai.service.js';
import { SummarizeIssueRoute, GetAIJobRoute } from './ai.types.js';

export async function summarizeIssue(
  request: FastifyRequest<SummarizeIssueRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const response = await aiService.summarizeIssue(tenantId, request.body.issueId);
  return reply.status(202).send(response);
}

export async function getJobStatus(
  request: FastifyRequest<GetAIJobRoute>,
  reply: FastifyReply
) {
  const job = aiService.getJob(request.params.jobId);
  return reply.send(job);
}
