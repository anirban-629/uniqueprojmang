import { User, AuthUser, TenantRole, TenantMember } from '@flowline/types';
import { TenantContext } from '../../shared/types/index.js';

export interface CompanyDto {
  id: string;
  tenantId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface TenantMembershipDto {
  tenantId: string;
  companyId: string;
  name: string;
  slug: string;
  role: TenantRole;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationSlug?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface SwitchTenantRequestDto {
  targetTenantId: string;
}

export interface InviteUserRequestDto {
  email: string;
  role: TenantRole;
}

export interface AcceptInviteRequestDto {
  token: string;
  password?: string;
  fullName?: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
}

export interface AuthResponseDto {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
    role: TenantRole;
  };
  memberships: TenantMembershipDto[];
}

export interface CurrentUserResponseDto {
  user: User | AuthUser;
  tenant: TenantContext;
  memberships: TenantMembershipDto[];
}

export interface SessionDto {
  id: string;
  userId: string;
  tenantId: string;
  familyId: string;
  expiresAt: string;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  fullName?: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'pending_verification';
  emailVerifiedAt?: string;
  mfaSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

// Fastify Route Types
export interface RegisterRoute {
  Body: RegisterRequestDto;
}

export interface LoginRoute {
  Body: LoginRequestDto;
}

export interface RefreshTokenRoute {
  Body: RefreshTokenRequestDto;
}

export interface SwitchTenantRoute {
  Body: SwitchTenantRequestDto;
}

export interface InviteUserRoute {
  Body: InviteUserRequestDto;
}

export interface AcceptInviteRoute {
  Body: AcceptInviteRequestDto;
}

export interface ForgotPasswordRoute {
  Body: ForgotPasswordRequestDto;
}

export interface ResetPasswordRoute {
  Body: ResetPasswordRequestDto;
}

export interface RevokeSessionRoute {
  Params: { id: string };
}

export interface ListUsersRoute {}
export interface GetCurrentUserRoute {}
export interface ListCompaniesRoute {}
export interface ListSessionsRoute {}
export interface LogoutRoute {
  Body?: { refreshToken?: string };
}

export interface ListTenantMembersRoute {
  Params: { tenantId: string };
}

export interface UpdateMemberRoleRoute {
  Params: { tenantId: string; userId: string };
  Body: { role: TenantRole };
}

export interface RemoveMemberRoute {
  Params: { tenantId: string; userId: string };
}

export interface ListPermissionsRoute {}
