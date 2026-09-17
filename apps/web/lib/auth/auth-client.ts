import { apiClient } from '../api/client';
import type {
  User,
  TenantRole,
  AuthUser,
  RegisterRequestPayload,
  LoginRequestPayload,
  ResetPasswordRequestPayload,
  ForgotPasswordRequestPayload,
  SwitchTenantRequestPayload,
  AcceptInviteRequestPayload,
  InviteDetailsResponse,
  AuthSessionResponse,
} from '@flowline/types';

export type {
  RegisterRequestPayload,
  LoginRequestPayload,
  ResetPasswordRequestPayload,
  ForgotPasswordRequestPayload,
  SwitchTenantRequestPayload,
  AcceptInviteRequestPayload,
  InviteDetailsResponse,
  AuthSessionResponse,
};

export interface AuthResponse {
  user: User | AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: string;
    role: TenantRole | string;
  };
  memberships: Array<{
    tenantId: string;
    companyId: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export const authClient = {
  async me(): Promise<AuthSessionResponse> {
    return apiClient<AuthSessionResponse>('/api/auth/me');
  },

  async login(payload: LoginRequestPayload): Promise<AuthResponse> {
    return apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async register(payload: RegisterRequestPayload): Promise<AuthResponse> {
    return apiClient('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(refreshToken?: string): Promise<{ message: string }> {
    return apiClient('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  async logoutAll(): Promise<{ message: string }> {
    return apiClient('/api/auth/logout-all', {
      method: 'POST',
    });
  },

  async switchTenant(targetTenantId: string): Promise<{ accessToken: string; tenant: any }> {
    return apiClient('/api/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ targetTenantId }),
    });
  },

  async getTenants(): Promise<Array<{ id: string; name: string; slug: string; role?: string }>> {
    return apiClient('/api/auth/tenants');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiClient('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async getInviteDetails(token: string): Promise<InviteDetailsResponse> {
    return apiClient<InviteDetailsResponse>(`/api/auth/invite/${encodeURIComponent(token)}`);
  },

  async acceptInvite(payload: AcceptInviteRequestPayload): Promise<AuthResponse> {
    return apiClient('/api/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  },
};
