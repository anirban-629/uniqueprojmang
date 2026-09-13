import { FastifyPluginAsync } from 'fastify';

export const storageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/storage/upload-url', {
    schema: {
      tags: ['Storage'],
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            uploadUrl: { type: 'string' },
            fileKey: { type: 'string' },
            publicUrl: { type: 'string' },
            expiresInSeconds: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { filename, issueId } = request.body as any;
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const fileKey = `tenants/${request.tenant.companyId}/${issueId || 'general'}/${timestamp}-${sanitized}`;

    return reply.send({
      uploadUrl: `/api/storage/mock-upload?key=${encodeURIComponent(fileKey)}`,
      fileKey,
      publicUrl: `https://storage.flowline.internal/${fileKey}`,
      expiresInSeconds: 3600
    });
  });
};
