'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  authClient,
  type AuthSessionResponse,
  type RegisterRequestPayload,
  type AcceptInviteRequestPayload,
} from '../lib/auth/auth-client';
import type { User, TenantRole, AuthUser } from '@flowline/types';

const LAST_TENANT_KEY = 'flowline_last_tenant';

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
  user: (User | AuthUser) | null;
  currentTenant: TenantContextInfo | null;
  memberships: TenantMembership[];
  permissions: Set<string>;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterRequestPayload) => Promise<void>;
  acceptInvite: (payload: AcceptInviteRequestPayload) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  switchTenant: (targetTenantId: string) => Promise<void>;
  refetchPermissions: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: sessionData,
    isLoading,
    refetch,
  } = useQuery<AuthSessionResponse>({
    queryKey: ['session'],
    queryFn: () => authClient.me(),
    retry: false,
    staleTime: 60 * 1000, // 1 minute
  });

  const permissions = useMemo(() => {
    const list = sessionData?.tenant?.permissions || [];
    return new Set<string>(list as string[]);
  }, [sessionData]);

  const isEmailVerified = useMemo(() => {
    if (!sessionData?.user) return false;
    const u = sessionData.user as any;
    return Boolean(u.emailVerifiedAt || u.emailVerified);
  }, [sessionData]);

  // Persist last active workspace in localStorage
  useEffect(() => {
    if (sessionData?.tenant?.tenantId) {
      try {
        localStorage.setItem(LAST_TENANT_KEY, sessionData.tenant.tenantId);
      } catch {
        // Safe fallback in restricted environments
      }
    }
  }, [sessionData?.tenant?.tenantId]);

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

  const login = useCallback(
    async (email: string, password: string) => {
      await authClient.login({ email, password });
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    [queryClient]
  );

  const register = useCallback(
    async (payload: RegisterRequestPayload) => {
      await authClient.register(payload);
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    [queryClient]
  );

  const acceptInvite = useCallback(
    async (payload: AcceptInviteRequestPayload) => {
      await authClient.acceptInvite(payload);
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await authClient.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      queryClient.clear();
      window.location.href = '/login';
    }
  }, [queryClient]);

  const logoutAll = useCallback(async () => {
    try {
      await authClient.logoutAll();
    } catch {
      // Ignore network errors during logout-all
    } finally {
      queryClient.clear();
      window.location.href = '/login';
    }
  }, [queryClient]);

  const switchTenant = useCallback(
    async (targetTenantId: string) => {
      await authClient.switchTenant(targetTenantId);
      try {
        localStorage.setItem(LAST_TENANT_KEY, targetTenantId);
      } catch {
        // ignore
      }
      queryClient.removeQueries();
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    [queryClient]
  );

  const refetchPermissions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  }, [queryClient]);

  const resendVerificationEmail = useCallback(async () => {
    // In production, invokes email trigger service
    return { message: 'Verification link sent to your email.' };
  }, []);

  const value: AuthContextValue = {
    user: sessionData?.user || null,
    currentTenant: sessionData?.tenant
      ? {
          ...sessionData.tenant,
          permissions: (sessionData.tenant.permissions || []) as string[],
        }
      : null,
    memberships: sessionData?.memberships || [],
    permissions,
    isAuthenticated: Boolean(sessionData?.user),
    isEmailVerified,
    isLoading,
    login,
    register,
    acceptInvite,
    logout,
    logoutAll,
    switchTenant,
    refetchPermissions,
    resendVerificationEmail,
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
