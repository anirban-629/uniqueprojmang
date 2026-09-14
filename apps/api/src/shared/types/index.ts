export interface TenantContext {
  tenantId: string;
  companyId: string;
  userId: string;
  role: 'admin' | 'tech_lead' | 'engineer' | 'product_manager' | 'designer';
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
