export interface InboundWebhookDto {
  [key: string]: unknown;
}

export interface InboundWebhookResponseDto {
  received: boolean;
  timestamp: number;
}

export interface GenerateUploadUrlDto {
  filename: string;
  contentType: string;
  issueId?: string;
}

export interface GenerateUploadUrlResponseDto {
  bucket: string;
  filePath: string;
  uploadUrl: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface InboundWebhookRoute {
  Body: InboundWebhookDto;
}

export interface GenerateUploadUrlRoute {
  Body: GenerateUploadUrlDto;
}
