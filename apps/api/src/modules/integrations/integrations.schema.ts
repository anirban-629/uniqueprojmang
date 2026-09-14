import { FastifySchema } from 'fastify';

export const inboundWebhookSchema: FastifySchema = {
  tags: ['Integrations'],
  summary: 'Inbound Webhook Receiver (GitHub/GitLab/Jira)',
  description: 'Ingests external third-party webhook events and maps them to internal domain events.'
};

export const generateUploadUrlSchema: FastifySchema = {
  tags: ['Integrations — Storage'],
  summary: 'Generate Supabase Storage Signed Upload URL',
  description: 'Generates an authorized signed URL for direct file upload into Supabase Storage.',
  body: {
    type: 'object',
    required: ['filename', 'contentType'],
    properties: {
      filename: { type: 'string', example: 'screenshot.png' },
      contentType: { type: 'string', example: 'image/png' },
      issueId: { type: 'string' }
    }
  }
};
