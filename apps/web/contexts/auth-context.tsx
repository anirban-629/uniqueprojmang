'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient, type AuthSessionResponse, type RegisterPayload } from '../lib/auth/auth-client';
import type { User, TenantRole } from '@flowline/types';

export interface TenantContextInfo {
  userId: string;
  tenantId: string;
  companyId: string;
  role: TenantRole | string;
  permissions: string[];
  email?: string;
}

export interface TenantMembership {
  tenantId: string;
  companyId: string;
  name: string;
  slug: string;
  role: string;
}

export interface AuthContextValue {
  user: User | null;
  currentTenant: TenantContextInfo | null;
  memberships: TenantMembership[];
  permissions: Set<string>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchTenant: (targetTenantId: string) => Promise<void>;
  refetchPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading, refetch } = useQuery<AuthSessionResponse>({
    queryKey: ['session'],
    queryFn: () => authClient.me(),
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });

  const permissions = useMemo(() => {
    const list = sessionData?.tenant?.permissions || [];
    return new Set<string>(list);
  }, [sessionData]);

  // Tab-focus / mid-session invalidation handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  const login = async (email: string, password: string, tenantId?: string) => {
    await authClient.login({ email, password, tenantId });
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  const register = async (payload: RegisterPayload) => {
    await authClient.register(payload);
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  const logout = async () => {
    try {
      await authClient.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      queryClient.clear();
      window.location.href = '/login';
    }
  };

  const switchTenant = async (targetTenantId: string) => {
    await authClient.switchTenant(targetTenantId);
    // Invalidate session and all tenant-scoped queries
    queryClient.removeQueries();
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  const refetchPermissions = async () => {
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  };

  const value: AuthContextValue = {
    user: sessionData?.user || null,
    currentTenant: sessionData?.tenant 
      ? {
          ...sessionData.tenant,
          permissions: sessionData.tenant.permissions || []
        } 
      : null,
    memberships: sessionData?.memberships || [],
    permissions,
    isAuthenticated: Boolean(sessionData?.user),
    isLoading,
    login,
    register,
    logout,
    switchTenant,
    refetchPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
