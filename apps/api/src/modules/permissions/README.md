# Permissions Module

## Purpose
The Permissions module implements granular, data-driven Role-Based Access Control (RBAC) across Flowline. It resolves, combines, and caches multi-scoped permission grants across workspace (tenant) and project levels, serving as the single source of truth for authorization checks across all domain modules.

## Public Interface
This module does not expose direct external HTTP routes. It exports a domain service (`permissionsService`) for programmatic checks and provides Fastify preHandler hooks (`requirePermission`, `requireAnyPermission`) located in `apps/api/src/plugins/authorization.plugin.ts` for declarative route guarding.

| Method | Path | Description | Auth Required |
|---|---|---|---|
| Service Call | `permissionsService.resolveUserPermissions(userId, tenantId, projectId?)` | Resolves effective `Set<PermissionKey>` combining tenant and optional project roles | Yes |
| Service Call | `permissionsService.getResolvedContext(userId, tenantId, projectId?)` | Returns fully resolved `ResolvedPermissions` DTO including assigned roles and permissions | Yes |
| Service Call | `permissionsService.getAllAvailablePermissions()` | Lists all registered system permissions and their metadata | Yes |
| Hook | `requirePermission(permission: PermissionKey)` | Fastify route preHandler enforcing single permission | Yes |
| Hook | `requireAnyPermission(permissions: PermissionKey[])` | Fastify route preHandler enforcing at least one of given permissions | Yes |

## Request/Response Contracts

### Key DTOs (`permissions.types.ts`)
```typescript
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
```

### Resolved Permissions (`@flowline/types`)
```typescript
export interface ResolvedPermissions {
  userId: string;
  tenantId: string;
  projectId?: string;
  tenantRole: string;
  projectRole?: string;
  permissions: PermissionKey[];
}
```

## Business Logic Summary
- **Multi-Scope Resolution (`resolveUserPermissions`)**:
  1. Queries the user's workspace membership and role (`getTenantRole`). If the user is not a member of the workspace, throws a `ForbiddenError`.
  2. Retrieves all permissions mapped to that tenant role (`getPermissionsForTenantRole`).
  3. If a `projectId` is supplied, queries the user's project membership (`getProjectRole`) and retrieves project-scoped permissions (`getPermissionsForProjectRole`).
  4. Returns the union of tenant-level and project-level permissions as a `Set<PermissionKey>`.
- **In-Memory Caching (`cache`)**: Resolved permission sets are cached with a 60-second TTL keyed by `perms:${userId}:${tenantId}:${projectId || 'root'}` to eliminate redundant database queries on high-throughput endpoints.
- **Event-Driven Cache Invalidation**: Automatically clears cached permission entries for affected users upon receiving membership/role change events:
  - `auth:member_role_changed`
  - `auth:tenant_switched`
- **Declarative Route Guarding**: The `requirePermission` plugin automatically extracts `tenantId`, `userId`, and `projectId` (from params or query) to verify permissions before the route controller executes.

## Data Model
Operates on the PostgreSQL RBAC schema defined in `packages/db/schemas/01b_rbac_roles_and_permissions.sql` with fallback in-memory maps for offline development:

- `permissions` (`id`, `key`, `description`, `scope`)
- `tenant_roles` (`id`, `tenant_id`, `name`, `is_system`)
- `tenant_role_permissions` (`tenant_role_id`, `permission_id`)
- `project_roles` (`id`, `tenant_id`, `name`, `is_system`)
- `project_role_permissions` (`project_role_id`, `permission_id`)
- `tenant_members` (`tenant_role_id`)
- `project_members` (`project_role_id`)

## Domain Events
### Published
None. This module does not publish domain events directly.

### Subscribed
- `auth:member_role_changed`: Triggers `invalidateUserCache(targetUserId)` when a tenant member's role is updated.
- `auth:tenant_switched`: Triggers `invalidateUserCache(userId)` when a user changes active workspace context.

## In-Memory State
- `cache: Map<string, CacheEntry>`: Caches permission sets with timestamp `resolvedAt`. TTL is 60,000 ms. Does not persist across server restarts.

## Dependencies
- `@flowline/types`: `PermissionKey`, `TenantRole`, `ProjectRole`, `ResolvedPermissions`.
- `../../db/client.js`: PostgreSQL connection pool (`pool`).
- `../../shared/event-bus.js`: Centralized `eventBus` for invalidation events.
- `../../shared/logger.js`: Structured logging for RBAC checks and cache events.
- `../../shared/errors/index.js`: `ForbiddenError`, `UnauthorizedError`.

## Error Handling
- `ForbiddenError('Not a member of this workspace')` (HTTP 403): Thrown when the user is not found in the workspace membership records.
- `ForbiddenError('Missing required permission: <key>')` (HTTP 403): Thrown by `requirePermission` when the user lacks the required permission.
- Database query failures fall back gracefully to default role-to-permission mappings in offline or mock environments.

## Known Limitations / TODOs
- None noted.

## Configuration
- `DATABASE_URL`: When set, queries database tables for dynamic role-permission mappings. When omitted, utilizes built-in default role permissions.
