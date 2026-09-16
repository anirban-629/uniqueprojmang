import { FastifyRequest, FastifyReply } from 'fastify';
import { PermissionKey } from '@flowline/types';
import { ForbiddenError, UnauthorizedError } from '../shared/errors/index.js';
import { permissionsService } from '../modules/permissions/permissions.service.js';

declare module 'fastify' {
  interface FastifyRequest {
    permissions?: Set<PermissionKey>;
  }
}

/**
 * Fastify preHandler hook for declarative Role-Based Access Control (RBAC).
 * Enforces that the authenticated user possesses the specified permission flag.
 *
 * Example:
 * fastify.delete('/projects/:projectId/issues/:issueId', {
 *   preHandler: [requirePermission('issue.delete.any')]
 * }, handler);
 */
export function requirePermission(permission: PermissionKey) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const tenant = request.companyTenant;
    if (!tenant || !tenant.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    // Extract projectId if route or query is project-scoped
    const params = (request.params as any) || {};
    const query = (request.query as any) || {};
    const projectId = params.projectId || query.projectId;

    const perms = await permissionsService.resolveUserPermissions(
      tenant.userId,
      tenant.companyId || tenant.tenantId,
      projectId
    );

    request.permissions = perms;

    if (!perms.has(permission)) {
      request.log.warn(
        {
          userId: tenant.userId,
          tenantId: tenant.tenantId,
          projectId,
          requiredPermission: permission,
          userRole: tenant.role
        },
        'RBAC authorization denied'
      );

      throw new ForbiddenError(`Missing required permission: ${permission}`);
    }
  };
}

/**
 * Fastify preHandler hook ensuring user has at least one of the specified permissions.
 */
export function requireAnyPermission(permissions: PermissionKey[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const tenant = request.companyTenant;
    if (!tenant || !tenant.userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const params = (request.params as any) || {};
    const query = (request.query as any) || {};
    const projectId = params.projectId || query.projectId;

    const perms = await permissionsService.resolveUserPermissions(
      tenant.userId,
      tenant.companyId || tenant.tenantId,
      projectId
    );

    request.permissions = perms;

    const hasAny = permissions.some(p => perms.has(p));
    if (!hasAny) {
      request.log.warn(
        {
          userId: tenant.userId,
          tenantId: tenant.tenantId,
          projectId,
          requiredPermissions: permissions,
          userRole: tenant.role
        },
        'RBAC authorization denied (none of required permissions granted)'
      );

      throw new ForbiddenError(`Missing at least one required permission: ${permissions.join(', ')}`);
    }
  };
}
