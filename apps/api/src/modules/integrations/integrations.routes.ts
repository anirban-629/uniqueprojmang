import { FastifyPluginAsync } from 'fastify';
import * as controller from './integrations.controller.js';
import * as schemas from './integrations.schema.js';
import { InboundWebhookRoute, GenerateUploadUrlRoute } from './integrations.types.js';

export const integrationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<InboundWebhookRoute>('/api/integrations/webhooks/inbound', { schema: schemas.inboundWebhookSchema }, controller.handleInboundWebhook);
  fastify.post<GenerateUploadUrlRoute>('/api/storage/upload-url', { schema: schemas.generateUploadUrlSchema }, controller.generateUploadUrl);
};
