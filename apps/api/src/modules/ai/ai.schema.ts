import { FastifySchema } from 'fastify';

export const summarizeIssueSchema: FastifySchema = {
  tags: ['AI Assistant'],
  summary: 'Generate Issue Summary (Async & Budget-Aware)',
  description: 'Creates an asynchronous AI job to generate ticket summaries without blocking HTTP requests.',
  body: {
    type: 'object',
    required: ['issueId'],
    properties: {
      issueId: { type: 'string' }
    }
  }
};

export const getAIJobSchema: FastifySchema = {
  tags: ['AI Assistant'],
  summary: 'Get AI Job Status',
  params: {
    type: 'object',
    properties: { jobId: { type: 'string' } },
    required: ['jobId']
  }
};
