import { createChildLogger } from '../../shared/logger.js';
import { storageHelper, StorageHelper } from './integrations.storage.js';
import {
  InboundWebhookDto,
  InboundWebhookResponseDto,
  GenerateUploadUrlDto,
  GenerateUploadUrlResponseDto
} from './integrations.types.js';

const logger = createChildLogger('integrations');

export class IntegrationsService {
  constructor(private readonly storage: StorageHelper = storageHelper) {}

  public processInboundWebhook(payload: InboundWebhookDto): InboundWebhookResponseDto {
    logger.info({ payloadKeys: Object.keys(payload) }, 'Received inbound webhook payload');
    return {
      received: true,
      timestamp: Date.now()
    };
  }

  public generateUploadUrl(
    tenantId: string,
    dto: GenerateUploadUrlDto
  ): GenerateUploadUrlResponseDto {
    logger.info({ tenantId, filename: dto.filename, contentType: dto.contentType }, 'Generating Supabase Storage signed upload URL');
    return this.storage.generateSignedUploadUrl(tenantId, dto);
  }
}

export const integrationsService = new IntegrationsService();
