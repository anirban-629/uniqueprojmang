import { env } from '../../config/env.config.js';
import { GenerateUploadUrlDto, GenerateUploadUrlResponseDto } from './integrations.types.js';

export class StorageHelper {
  public generateSignedUploadUrl(
    tenantId: string,
    dto: GenerateUploadUrlDto
  ): GenerateUploadUrlResponseDto {
    const sanitized = dto.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const bucket = env.SUPABASE_STORAGE_BUCKET || 'attachments';
    const filePath = `tenants/${tenantId}/${dto.issueId || 'general'}/${timestamp}-${sanitized}`;
    const supabaseUrl = env.SUPABASE_URL || '';

    return {
      bucket,
      filePath,
      uploadUrl: `${supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${filePath}`,
      publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`,
      expiresInSeconds: 3600
    };
  }
}

export const storageHelper = new StorageHelper();
