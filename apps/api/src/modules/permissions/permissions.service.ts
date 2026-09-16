import { PermissionKey, ResolvedPermissions } from '@flowline/types';
import { ForbiddenError } from '../../shared/errors/index.js';
import { eventBus } from '../../shared/event-bus.js';
import { logger } from '../../shared/logger.js';
import { permissionsRepository, PermissionsRepository } from './permissions.repository.js';

interface CacheEntry {
  permissions: Set<PermissionKey>;
  resolvedAt: number;
}

export class PermissionsService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

  constructor(private readonly repo: PermissionsRepository = permissionsRepository) {
    this.setupInvalidationListeners();
  }

  private setupInvalidationListeners(): void {
    // Invalidate cached permissions when roles or memberships change
    eventBus.subscribe('auth:member_role_changed', (event: any) => {
      const payload = event.payload;
      if (payload?.targetUserId) {
        this.invalidateUserCache(payload.targetUserId);
      }
    });

    eventBus.subscribe('auth:tenant_switched', (event: any) => {
      const payload = event.payload;
      if (payload?.userId) {
        this.invalidateUserCache(payload.userId);
      }
    });
  }

  private getCacheKey(userId: string, tenantId: string, projectId?: string): string {
    return `perms:${userId}:${tenantId}:${projectId || 'root'}`;
  }

  public invalidateUserCache(userId: string): void {
    const prefix = `perms:${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    logger.debug({ userId }, 'Invalidated permissions cache for user');
  }

  public async resolveUserPermissions(
    userId: string,
    tenantId: string,
    projectId?: string
  ): Promise<Set<PermissionKey>> {
    const cacheKey = this.getCacheKey(userId, tenantId, projectId);
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.resolvedAt) < this.CACHE_TTL_MS) {
      return cached.permissions;
    }

    // 1. Resolve Tenant Role
    const tenantRoleAssignment = await this.repo.getTenantRole(userId, tenantId);
    if (!tenantRoleAssignment) {
      throw new ForbiddenError('Not a member of this workspace');
    }

    const tenantPerms = await this.repo.getPermissionsForTenantRole(
      tenantRoleAssignment.role,
      tenantRoleAssignment.roleId
    );

    // 2. Resolve Project Role (if project-scoped)
    let projectPerms: PermissionKey[] = [];
    if (projectId) {
      const projectRoleAssignment = await this.repo.getProjectRole(userId, projectId);
      if (projectRoleAssignment) {
        projectPerms = await this.repo.getPermissionsForProjectRole(
          projectRoleAssignment.role,
          projectRoleAssignment.roleId
        );
      }
    }

    // 3. Union: combine tenant-level and project-level grants
    const effectivePermissions = new Set<PermissionKey>([...tenantPerms, ...projectPerms]);

    this.cache.set(cacheKey, {
      permissions: effectivePermissions,
      resolvedAt: Date.now()
    });

    return effectivePermissions;
  }

  public async getResolvedContext(
    userId: string,
    tenantId: string,
    projectId?: string
  ): Promise<ResolvedPermissions> {
    const tenantRoleAssignment = await this.repo.getTenantRole(userId, tenantId);
    const tenantRole = tenantRoleAssignment?.role || 'member';

    let projectRole: string | undefined;
    if (projectId) {
      const projectRoleAssignment = await this.repo.getProjectRole(userId, projectId);
      projectRole = projectRoleAssignment?.role;
    }

    const permsSet = await this.resolveUserPermissions(userId, tenantId, projectId);

    return {
      userId,
      tenantId,
      projectId,
      tenantRole,
      projectRole,
      permissions: Array.from(permsSet)
    };
  }

  public async getAllAvailablePermissions(): Promise<{ key: PermissionKey; description: string; scope: string }[]> {
    return this.repo.getAllPermissions();
  }
}

export const permissionsService = new PermissionsService();
