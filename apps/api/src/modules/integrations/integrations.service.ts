import { storageHelper, StorageHelper } from './integrations.storage.js';
import {
  InboundWebhookDto,
  InboundWebhookResponseDto,
  GenerateUploadUrlDto,
  GenerateUploadUrlResponseDto
} from './integrations.types.js';

export class IntegrationsService {
  constructor(private readonly storage: StorageHelper = storageHelper) {}

  public processInboundWebhook(payload: InboundWebhookDto): InboundWebhookResponseDto {
    console.log('[Integrations] Received inbound webhook payload:', payload);
    return {
      received: true,
      timestamp: Date.now()
    };
  }

  public generateUploadUrl(
    tenantId: string,
    dto: GenerateUploadUrlDto
  ): GenerateUploadUrlResponseDto {
    return this.storage.generateSignedUploadUrl(tenantId, dto);
  }
}

export const integrationsService = new IntegrationsService();
