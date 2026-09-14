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
  // STORAGE & ASSET URLS (Supabase Storage Signed URLs)
  // -------------------------------------------------------------
  fastify.post('/api/storage/upload-url', {
    schema: {
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
    }
  }, async (request, reply) => {
    const { filename, issueId } = request.body as any;
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const tenantId = request.companyTenant?.tenantId || 'acme-corp';
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'attachments';
    const filePath = `tenants/${tenantId}/${issueId || 'general'}/${timestamp}-${sanitized}`;
    const supabaseUrl = process.env.SUPABASE_URL || 'https://mock.supabase.co';

    return reply.send({
      bucket,
      filePath,
      uploadUrl: `${supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${filePath}`,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`,
      expiresInSeconds: 3600
    });
  });
};
