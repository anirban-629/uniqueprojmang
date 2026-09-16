'use client';

import React from 'react';
import { usePermission } from '../../hooks/use-permission';
import type { PermissionKey } from '@flowline/types';

export interface RequirePermissionProps {
  permission: PermissionKey | string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Component wrapper that renders its children only if the active user
 * has the specified permission in the current tenant/project context.
 */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const allowed = usePermission(permission);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
