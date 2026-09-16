import { PermissionKey, TenantRole, ProjectRole } from '@flowline/types';
import { pool } from '../../db/client.js';
import { env } from '../../config/env.config.js';
import { logger } from '../../shared/logger.js';
import { UserRoleAssignment, UserProjectRoleAssignment } from './permissions.types.js';

// In-memory default permissions map for offline / sandbox mode
const DEFAULT_TENANT_ROLE_PERMS: Record<string, PermissionKey[]> = {
  owner: [
    'tenant.view',
    'tenant.update',
    'tenant.delete',
    'members.view',
    'members.manage',
    'members.remove',
    'billing.manage',
    'projects.create',
    'invitations.create'
  ],
  admin: [
    'tenant.view',
    'tenant.update',
    'members.view',
    'members.manage',
    'members.remove',
    'billing.manage',
    'projects.create',
    'invitations.create'
  ],
  member: [
    'tenant.view',
    'members.view',
    'projects.create'
  ],
  billing_manager: [
    'tenant.view',
    'billing.manage'
  ],
  viewer: [
    'tenant.view'
  ],
  guest: [
    'tenant.view'
  ]
};

const DEFAULT_PROJECT_ROLE_PERMS: Record<string, PermissionKey[]> = {
  lead: [
    'project.view',
    'project.update',
    'project.archive',
    'project.delete',
    'project.manage_members',
    'issue.create',
    'issue.view',
    'issue.edit.own',
    'issue.edit.any',
    'issue.delete.own',
    'issue.delete.any',
    'comment.create',
    'comment.delete.own',
    'comment.delete.any'
  ],
  contributor: [
    'project.view',
    'issue.create',
    'issue.view',
    'issue.edit.own',
    'issue.edit.any',
    'issue.delete.own',
    'comment.create',
    'comment.delete.own'
  ],
  reporter: [
    'project.view',
    'issue.create',
    'issue.view',
    'issue.edit.own',
    'comment.create'
  ],
  viewer: [
    'project.view',
    'issue.view'
  ],
  guest: [
    'project.view'
  ]
};

export class PermissionsRepository {
  private hasDb(): boolean {
    return Boolean(env.DATABASE_URL);
  }

  public async getTenantRole(userId: string, tenantId: string): Promise<UserRoleAssignment | null> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT tm.user_id as "userId", tm.tenant_id as "tenantId", 
                 COALESCE(tr.name, tm.role) as "role",
                 tm.tenant_role_id as "roleId"
          FROM tenant_members tm
          LEFT JOIN tenant_roles tr ON tm.tenant_role_id = tr.id
          WHERE tm.user_id = $1 AND (tm.tenant_id = $2 OR tm.tenant_id::text = $2)
          LIMIT 1;
        `;
        const res = await pool.query(query, [userId, tenantId]);
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        logger.warn({ err, userId, tenantId }, 'DB query failed in getTenantRole, falling back to mock');
      }
    }

    return {
      userId,
      tenantId,
      role: 'owner' // default mock fallback for dev
    };
  }

  public async getProjectRole(userId: string, projectId: string): Promise<UserProjectRoleAssignment | null> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT pm.user_id as "userId", pm.project_id as "projectId",
                 COALESCE(pr.name, pm.role) as "role",
                 pm.project_role_id as "roleId"
          FROM project_members pm
          LEFT JOIN project_roles pr ON pm.project_role_id = pr.id
          WHERE pm.user_id = $1 AND (pm.project_id = $2 OR pm.project_id::text = $2)
          LIMIT 1;
        `;
        const res = await pool.query(query, [userId, projectId]);
        if (res.rows[0]) return res.rows[0];
      } catch (err) {
        logger.warn({ err, userId, projectId }, 'DB query failed in getProjectRole, falling back to mock');
      }
    }

    return {
      userId,
      projectId,
      role: 'lead'
    };
  }

  public async getPermissionsForTenantRole(roleName: string, roleId?: string): Promise<PermissionKey[]> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT p.key
          FROM permissions p
          JOIN tenant_role_permissions trp ON p.id = trp.permission_id
          JOIN tenant_roles tr ON trp.tenant_role_id = tr.id
          WHERE (tr.id = $1 OR tr.name = $2)
        `;
        const res = await pool.query(query, [roleId || '00000000-0000-0000-0000-000000000000', roleName]);
        if (res.rows.length > 0) {
          return res.rows.map(r => r.key as PermissionKey);
        }
      } catch (err) {
        logger.warn({ err, roleName }, 'DB query failed in getPermissionsForTenantRole, falling back to static map');
      }
    }

    return DEFAULT_TENANT_ROLE_PERMS[roleName.toLowerCase()] || ['tenant.view'];
  }

  public async getPermissionsForProjectRole(roleName: string, roleId?: string): Promise<PermissionKey[]> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT p.key
          FROM permissions p
          JOIN project_role_permissions prp ON p.id = prp.permission_id
          JOIN project_roles pr ON prp.project_role_id = pr.id
          WHERE (pr.id = $1 OR pr.name = $2)
        `;
        const res = await pool.query(query, [roleId || '00000000-0000-0000-0000-000000000000', roleName]);
        if (res.rows.length > 0) {
          return res.rows.map(r => r.key as PermissionKey);
        }
      } catch (err) {
        logger.warn({ err, roleName }, 'DB query failed in getPermissionsForProjectRole, falling back to static map');
      }
    }

    return DEFAULT_PROJECT_ROLE_PERMS[roleName.toLowerCase()] || ['project.view'];
  }

  public async getAllPermissions(): Promise<{ key: PermissionKey; description: string; scope: string }[]> {
    if (this.hasDb()) {
      try {
        const res = await pool.query('SELECT key, description, scope FROM permissions ORDER BY scope, key ASC;');
        if (res.rows.length > 0) return res.rows;
      } catch (err) {
        logger.warn({ err }, 'Failed to query permissions table, using static map');
      }
    }

    const allKeys: { key: PermissionKey; description: string; scope: string }[] = [];
    for (const [_, keys] of Object.entries(DEFAULT_TENANT_ROLE_PERMS)) {
      for (const k of keys) {
        if (!allKeys.some(item => item.key === k)) {
          allKeys.push({ key: k, description: `Permission ${k}`, scope: 'tenant' });
        }
      }
    }
    for (const [_, keys] of Object.entries(DEFAULT_PROJECT_ROLE_PERMS)) {
      for (const k of keys) {
        if (!allKeys.some(item => item.key === k)) {
          allKeys.push({ key: k, description: `Permission ${k}`, scope: 'project' });
        }
      }
    }
    return allKeys;
  }
}

export const permissionsRepository = new PermissionsRepository();
