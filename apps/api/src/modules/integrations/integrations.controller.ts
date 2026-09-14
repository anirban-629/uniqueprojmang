import { FastifyRequest, FastifyReply } from 'fastify';
import { integrationsService } from './integrations.service.js';
import { InboundWebhookRoute, GenerateUploadUrlRoute } from './integrations.types.js';

export async function handleInboundWebhook(
  request: FastifyRequest<InboundWebhookRoute>,
  reply: FastifyReply
) {
  const result = integrationsService.processInboundWebhook(request.body);
  return reply.status(200).send(result);
}

export async function generateUploadUrl(
  request: FastifyRequest<GenerateUploadUrlRoute>,
  reply: FastifyReply
) {
  const tenantId = request.companyTenant?.tenantId || 'acme-corp';
  const result = integrationsService.generateUploadUrl(tenantId, request.body);
  return reply.send(result);
}
