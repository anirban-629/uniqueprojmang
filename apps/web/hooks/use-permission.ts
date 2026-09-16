import { useAuth } from './use-auth';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '../lib/auth/permissions';
import type { PermissionKey } from '@flowline/types';

/**
 * Returns whether the authenticated user currently holds the required permission.
 */
export function usePermission(permission: PermissionKey | string): boolean {
  const { permissions } = useAuth();
  return hasPermission(permissions, permission);
}

/**
 * Returns whether the authenticated user holds ALL specified permissions.
 */
export function useAllPermissions(requiredPermissions: (PermissionKey | string)[]): boolean {
  const { permissions } = useAuth();
  return hasAllPermissions(permissions, requiredPermissions);
}

/**
 * Returns whether the authenticated user holds ANY of the specified permissions.
 */
export function useAnyPermission(requiredPermissions: (PermissionKey | string)[]): boolean {
  const { permissions } = useAuth();
  return hasAnyPermission(permissions, requiredPermissions);
}
