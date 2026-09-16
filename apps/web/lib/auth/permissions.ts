import type { PermissionKey } from '@flowline/types';

/**
 * Checks if a set of user permissions satisfies a requested permission.
 * Supports exact match as well as wildcard scopes (e.g., 'issue.*' covers 'issue.delete.any').
 */
export function hasPermission(
  userPermissions: Set<string> | string[] | undefined,
  requiredPermission: PermissionKey | string
): boolean {
  if (!userPermissions) return false;

  const permissionsSet = userPermissions instanceof Set 
    ? userPermissions 
    : new Set(userPermissions);

  if (permissionsSet.has('*') || permissionsSet.has(requiredPermission)) {
    return true;
  }

  // Handle prefix wildcard matching (e.g., 'issue.*' matches 'issue.delete.any')
  const parts = requiredPermission.split('.');
  if (parts.length > 1) {
    const scopeWildcard = `${parts[0]}.*`;
    if (permissionsSet.has(scopeWildcard)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a user has ALL of the specified permissions.
 */
export function hasAllPermissions(
  userPermissions: Set<string> | string[] | undefined,
  requiredPermissions: (PermissionKey | string)[]
): boolean {
  return requiredPermissions.every((perm) => hasPermission(userPermissions, perm));
}

/**
 * Checks if a user has AT LEAST ONE of the specified permissions.
 */
export function hasAnyPermission(
  userPermissions: Set<string> | string[] | undefined,
  requiredPermissions: (PermissionKey | string)[]
): boolean {
  return requiredPermissions.some((perm) => hasPermission(userPermissions, perm));
}
