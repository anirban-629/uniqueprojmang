import { apiClient } from '../api/client';
import type { User, TenantRole } from '@flowline/types';

export interface AuthSessionResponse {
  user: User;
  tenant: {
    userId: string;
    tenantId: string;
    companyId: string;
    role: TenantRole | string;
    permissions?: string[];
    email?: string;
  };
  memberships: Array<{
    tenantId: string;
    companyId: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantId?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  tenantName: string;
  tenantSlug?: string;
}

export interface SwitchTenantPayload {
  targetTenantId: string;
}

export const authClient = {
  async me(): Promise<AuthSessionResponse> {
    return apiClient<AuthSessionResponse>('/api/auth/me');
  },

  async login(payload: LoginPayload): Promise<{ accessToken: string; user: User; tenant: any }> {
    return apiClient('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async register(payload: RegisterPayload): Promise<{ accessToken: string; user: User; tenant: any }> {
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

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiClient('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  },
};
