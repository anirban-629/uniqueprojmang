import { FastifyPluginAsync } from 'fastify';
import { mockDb } from '@flowline/mock-db';

// In-memory asynchronous AI jobs queue ($0 free tier)
interface AIJob {
  id: string;
  tenantId: string;
  type: 'summarize_issue' | 'suggest_subtasks' | 'triage_priority';
  issueId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  createdAt: string;
}

const AI_JOBS = new Map<string, AIJob>();

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/ai/summarize — Async Issue Summarization
  fastify.post('/api/ai/summarize', {
    schema: {
      tags: ['AI Assistant'],
      summary: 'Generate Issue Summary (Async & Budget-Aware)',
      description: 'Creates an asynchronous AI job to generate ticket summaries without blocking HTTP requests.',
      body: {
        type: 'object',
        required: ['issueId'],
        properties: { issueId: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const { issueId } = request.body as { issueId: string };
    const tenantId = request.companyTenant?.tenantId || 'acme-corp';

    const issue = mockDb.getIssueByIdOrKey(issueId);
    if (!issue) {
      return reply.status(404).send({ error: 'Issue not found' });
    }

    const jobId = `job-ai-${Date.now()}`;
    const job: AIJob = {
      id: jobId,
      tenantId,
      type: 'summarize_issue',
      issueId,
      status: 'completed', // Synchronous mock resolution
      result: {
        summary: `AI Summary: ${issue.title} focuses on ${issue.type} execution with ${issue.priority} priority.`,
        keyPoints: [
          'Requirement breakdown and scope verified.',
          `Assigned to user: ${issue.assigneeId || 'Unassigned'}.`,
          `Estimated effort: ${issue.storyPoints || 0} story points.`
        ],
        model: 'gemini-1.5-flash-free',
        tokensUsed: 142
      },
      createdAt: new Date().toISOString()
    };

    AI_JOBS.set(jobId, job);
    return reply.status(202).send({ jobId, status: job.status, result: job.result });
  });

  // GET /api/ai/jobs/:jobId — Check async job status
  fastify.get('/api/ai/jobs/:jobId', {
    schema: {
      tags: ['AI Assistant'],
      summary: 'Get AI Job Status',
      params: {
        type: 'object',
        properties: { jobId: { type: 'string' } },
        required: ['jobId']
      }
    }
  }, async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = AI_JOBS.get(jobId);
    if (!job) {
      return reply.status(404).send({ error: 'AI Job not found' });
    }
    return job;
  });
};
