import { User } from '@flowline/types';
import { TenantContext } from '../../shared/types/index.js';

export interface CompanyDto {
  id: string;
  tenantId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface CurrentUserResponseDto {
  user: User;
  tenant: TenantContext;
}

export interface ListUsersRoute {}
export interface GetCurrentUserRoute {}
export interface ListCompaniesRoute {}
