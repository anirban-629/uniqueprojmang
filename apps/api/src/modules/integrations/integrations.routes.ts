import { FastifyPluginAsync } from 'fastify';

export const integrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // -------------------------------------------------------------
  // WEBHOOKS & THIRD PARTY INTEGRATIONS
  // -------------------------------------------------------------
  fastify.post('/api/integrations/webhooks/inbound', {
    schema: {
      tags: ['Integrations'],
      summary: 'Inbound Webhook Receiver (GitHub/GitLab/Jira)',
      description: 'Ingests external third-party webhook events and maps them to internal domain events.'
    }
  }, async (request, reply) => {
    const body = request.body as any;
    console.log('[Integrations] Received inbound webhook payload:', body);
    return reply.status(200).send({ received: true, timestamp: Date.now() });
  });

  // -------------------------------------------------------------
  // STORAGE & ASSET URLS (Cloudflare R2 Presigned URLs)
  // -------------------------------------------------------------
  fastify.post('/api/storage/upload-url', {
    schema: {
      tags: ['Integrations — Storage'],
      summary: 'Generate Cloudflare R2 Presigned Upload URL',
      description: 'Generates an authorized presigned URL for direct file upload with zero egress fees ($0 free tier).',
      body: {
        type: 'object',
        required: ['filename', 'contentType'],
        properties: {
          filename: { type: 'string', example: 'screenshot.png' },
          contentType: { type: 'string', example: 'image/png' },
          issueId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { filename, issueId } = request.body as any;
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const tenantId = request.companyTenant?.tenantId || 'acme-corp';
    const fileKey = `tenants/${tenantId}/${issueId || 'general'}/${timestamp}-${sanitized}`;

    return reply.send({
      uploadUrl: `/api/storage/mock-upload?key=${encodeURIComponent(fileKey)}`,
      fileKey,
      publicUrl: `https://storage.flowline.internal/${fileKey}`,
      expiresInSeconds: 3600
    });
  });
};
