import { PermissionKey } from '@flowline/types';
import { pool } from '../../db/client.js';
import { UserRoleAssignment, UserProjectRoleAssignment } from './permissions.types.js';

export class PermissionsRepository {
  public async getTenantRole(userId: string, tenantId: string): Promise<UserRoleAssignment | null> {
    const query = `
      SELECT tm.user_id::text as "userId", tm.tenant_id::text as "tenantId", 
             COALESCE(tr.name, tm.role) as "role",
             tm.tenant_role_id::text as "roleId"
      FROM tenant_members tm
      LEFT JOIN tenant_roles tr ON tm.tenant_role_id = tr.id
      WHERE tm.user_id::text = $1 AND tm.tenant_id::text = $2
      LIMIT 1;
    `;
    const res = await pool.query(query, [userId, tenantId]);
    return res.rows[0] || null;
  }

  public async getProjectRole(userId: string, projectId: string): Promise<UserProjectRoleAssignment | null> {
    const query = `
      SELECT pm.user_id::text as "userId", pm.project_id::text as "projectId",
             COALESCE(pr.name, pm.role) as "role",
             pm.project_role_id::text as "roleId"
      FROM project_members pm
      LEFT JOIN project_roles pr ON pm.project_role_id = pr.id
      WHERE pm.user_id::text = $1 AND pm.project_id::text = $2
      LIMIT 1;
    `;
    const res = await pool.query(query, [userId, projectId]);
    return res.rows[0] || null;
  }

  public async getPermissionsForTenantRole(roleName: string, roleId?: string): Promise<PermissionKey[]> {
    const query = `
      SELECT p.key
      FROM permissions p
      JOIN tenant_role_permissions trp ON p.id = trp.permission_id
      JOIN tenant_roles tr ON trp.tenant_role_id = tr.id
      WHERE (tr.id::text = $1 OR tr.name = $2)
    `;
    const res = await pool.query(query, [roleId || '00000000-0000-0000-0000-000000000000', roleName]);
    return res.rows.map(r => r.key as PermissionKey);
  }

  public async getPermissionsForProjectRole(roleName: string, roleId?: string): Promise<PermissionKey[]> {
    const query = `
      SELECT p.key
      FROM permissions p
      JOIN project_role_permissions prp ON p.id = prp.permission_id
      JOIN project_roles pr ON prp.project_role_id = pr.id
      WHERE (pr.id::text = $1 OR pr.name = $2)
    `;
    const res = await pool.query(query, [roleId || '00000000-0000-0000-0000-000000000000', roleName]);
    return res.rows.map(r => r.key as PermissionKey);
  }

  public async getAllPermissions(): Promise<{ key: PermissionKey; description: string; scope: string }[]> {
    const res = await pool.query('SELECT key, description, scope FROM permissions ORDER BY scope, key ASC;');
    return res.rows;
  }
}

export const permissionsRepository = new PermissionsRepository();
