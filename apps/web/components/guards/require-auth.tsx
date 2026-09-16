'use client';

import React from 'react';
import { useAuth } from '../../hooks/use-auth';

export interface RequireAuthProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component wrapper that renders its children only if the user is authenticated.
 */
export function RequireAuth({
  fallback = null,
  children,
}: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
