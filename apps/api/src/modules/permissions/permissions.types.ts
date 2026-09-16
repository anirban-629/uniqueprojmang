import { PermissionKey, TenantRole, ProjectRole, ResolvedPermissions } from '@flowline/types';

export interface PermissionCheckContext {
  userId: string;
  tenantId: string;
  projectId?: string;
}

export interface RolePermissionMapping {
  roleId: string;
  roleName: string;
  permissionKey: PermissionKey;
}

export interface UserRoleAssignment {
  userId: string;
  tenantId: string;
  role: TenantRole | string;
  roleId?: string;
}

export interface UserProjectRoleAssignment {
  userId: string;
  projectId: string;
  role: ProjectRole | string;
  roleId?: string;
}
