export interface TenantContext {
  tenantId: string;
  companyId: string;
  userId: string;
  role: 'owner' | 'admin' | 'tech_lead' | 'engineer' | 'product_manager' | 'designer' | 'member' | 'viewer';
}

export interface PaginationQuery {
  cursor?: string;
  limit?: number;
}

export interface ApiResponseMeta {
  serverTime: number;
  latencyMs: number;
  tenantId?: string;
  cached?: boolean;
}
