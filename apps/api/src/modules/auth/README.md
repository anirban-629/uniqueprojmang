# Auth Module

## Purpose

The `auth` module manages user identity, cryptographic authentication, multi-tenant workspace provisioning, session tokens, and tenant membership permissions. It acts as the security boundary for the Flowline backend, issuing short-lived JWT access tokens and managing refresh token rotation.

## Public Interface

| Method | Path | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Provisions a new company workspace, admin user, and returns tokens | No |
| POST | `/api/auth/login` | Authenticates user credentials, sets session cookie, returns tokens | No |
| POST | `/api/auth/refresh` | Rotates cryptographic refresh token and issues new JWT access token | No |
| POST | `/api/auth/logout` | Revokes the current session refresh token and blacklists access JTI | Yes |
| POST | `/api/auth/logout-all` | Revokes all active session families for the authenticated user | Yes |
| POST | `/api/auth/switch-tenant` | Switches active workspace context and issues new scoped JWT token | Yes |
| POST | `/api/auth/invite` | Creates a workspace invitation for a user with a specific role | Yes (Admin/Owner) |
| POST | `/api/auth/accept-invite` | Accepts an invitation token and registers or binds the user | No |
| GET | `/api/auth/sessions` | Lists active login sessions and device metadata for current user | Yes |
| GET | `/api/auth/me` | Fetches authenticated user profile, active tenant, and memberships | Yes |
| GET | `/api/users/me` | Alias for current user profile and tenant context | Yes |
| GET | `/api/users` | Lists users belonging to the active company workspace | Yes |
| GET | `/api/tenancy/companies` | Lists all companies/tenants accessible to the current user | Yes |
| GET | `/api/auth/tenants` | Alias for accessible workspace list | Yes |

## Request/Response Contracts

### Key Request DTOs

```typescript
export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
  organizationSlug?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface SwitchTenantRequestDto {
  targetTenantId: string;
}

export interface InviteUserRequestDto {
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface AcceptInviteRequestDto {
  token: string;
  password?: string;
  fullName?: string;
}
```

### Key Response DTOs

```typescript
export interface AuthResponseDto {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
    role: TenantRole;
  };
  memberships: TenantMembershipDto[];
}

export interface CurrentUserResponseDto {
  user: User | AuthUser;
  tenant: TenantContext;
  memberships: TenantMembershipDto[];
}

export interface TenantMembershipDto {
  tenantId: string;
  companyId: string;
  name: string;
  slug: string;
  role: TenantRole;
}
```

## Business Logic Summary

The core authentication workflow is encapsulated in `AuthService`:

1. **Registration Flow (`register`):**
   - Normalizes and validates email; enforces minimum 10-character password complexity.
   - Generates a unique, URL-safe tenant slug via `slugify()`.
   - Hashes passwords using Argon2id/bcrypt with server pepper and random salt.
   - Atomically persists the `users` record, `tenants` record, and assigns the user as `owner` in `tenant_memberships`.
   - Mints a dual-token pair (JWT access token with 15m expiration + SHA-256 hashed refresh token).
   - Emits `auth:user_registered` and `auth:tenant_created` domain events.

2. **Login Flow (`login`):**
   - Fetches user by normalized email and performs constant-time password hash verification.
   - Resolves tenant memberships. If no specific workspace is requested, defaults to the primary membership.
   - Generates a cryptographically secure 64-byte refresh token with a unique `familyId`.
   - Emits `auth:user_logged_in` and logs security audit trail.

3. **Refresh & Token Rotation (`refreshToken`):**
   - Computes SHA-256 digest of the raw incoming refresh token.
   - Performs family-based reuse detection: if a revoked token is presented, all child sessions in that `familyId` are immediately invalidated to mitigate token replay attacks.
   - Issues a fresh access token and child refresh token in the same family.

4. **Tenant Switching (`switchTenant`):**
   - Verifies user has active membership in the target tenant ID/slug.
   - Issues a new JWT containing `tenant_id`, `company_id`, and `role` claims for the target workspace without requiring re-authentication.
   - Emits `auth:tenant_switched` event.

5. **Workspace Invitations (`inviteUser`, `acceptInvite`):**
   - Generates a high-entropy secret token (hashed before storage in `invitations`).
   - Sets a 7-day expiration timestamp.
   - Upon acceptance, provisions account (if new) and creates `tenant_memberships` record.

## Data Model

Data access is managed by `AuthRepository` (`auth.repository.ts`), interacting with PostgreSQL when `DATABASE_URL` is configured, with an in-memory fallback for offline testing:

- **`users`**: `id` (UUID), `email` (unique), `password_hash`, `full_name`, `avatar_url`, `status`, `created_at`, `updated_at`.
- **`tenants`**: `id` (UUID), `name`, `slug` (unique), `plan`, `created_at`, `updated_at`.
- **`tenant_memberships`**: `id` (UUID), `tenant_id` (FK), `user_id` (FK), `role` (`owner` \| `admin` \| `member` \| `viewer`), `joined_at`.
- **`invitations`**: `id` (UUID), `tenant_id` (FK), `email`, `role`, `token_hash`, `invited_by`, `expires_at`, `accepted_at`.
- **`auth_audit_log`**: `id` (UUID), `tenant_id`, `user_id`, `action`, `ip`, `user_agent`, `metadata`, `created_at`.
- **`refresh_tokens`**: `id` (UUID), `user_id`, `tenant_id`, `token_hash`, `family_id`, `is_revoked`, `expires_at`.

## Domain Events

### Published

- **`auth:user_registered`**: Fired on successful account and workspace creation.
  - Payload: `{ userId: string, tenantId: string, email: string, fullName: string }`
- **`auth:user_logged_in`**: Fired on successful credential authentication.
  - Payload: `{ userId: string, tenantId: string, ip?: string, userAgent?: string }`
- **`auth:tenant_created`**: Fired when a new company workspace is registered.
  - Payload: `{ tenantId: string, name: string, slug: string, ownerId: string }`
- **`auth:member_invited`**: Fired when a workspace invitation is dispatched.
  - Payload: `{ invitationId: string, tenantId: string, email: string, role: string, invitedBy: string }`
- **`auth:tenant_switched`**: Fired when a user switches active workspace scope.
  - Payload: `{ userId: string, previousTenantId: string, newTenantId: string }`

### Subscribed

This module does not subscribe to external domain events; it acts as an event producer for downstream modules (`analytics`, `automation`, `realtime`).

## In-Memory State

- **`TokenRevocationStore` (`auth.tokens.ts`):**
  - Manages active refresh token records and a blacklisted `jti` (JWT ID) set for revoked access tokens.
  - Runs an automated non-blocking sweep timer every 5 minutes to evict expired tokens and memory cache entries.
  - In-memory fallback maps (`IN_MEMORY_USERS`, `IN_MEMORY_TENANTS`, `IN_MEMORY_MEMBERSHIPS`) are retained for standalone sandbox execution when PostgreSQL is disconnected.

## Dependencies

- **Internal Modules / Packages:**
  - `packages/types` — Shared DTOs, `DomainEvent`, `TenantRole`, `User`, `AuthUser`.
  - `packages/db` — Schema definitions and pooled database client (`apps/api/src/db/client.ts`).
  - `apps/api/src/shared/event-bus.ts` — In-process typed event bus.
  - `apps/api/src/shared/errors/` — Standard HTTP exception hierarchy (`UnauthorizedError`, `ValidationError`, `ConflictError`, `ForbiddenError`).
- **External Dependencies:**
  - `jsonwebtoken` — JWT token generation and signature verification.
  - `crypto` (Node.js native) — SHA-256 token hashing, high-entropy token generation, constant-time buffer comparison.
  - `pg` — PostgreSQL connection pool.

## Error Handling

| Error Class | HTTP Status | Trigger Condition |
|---|---|---|
| `ValidationError` | 400 Bad Request | Invalid email format, password < 10 chars, missing required fields |
| `UnauthorizedError` | 401 Unauthorized | Invalid credentials, expired/revoked JWT, invalid refresh token |
| `ForbiddenError` | 403 Forbidden | User attempting access or invite outside authorized tenant role |
| `NotFoundError` | 404 Not Found | User, tenant, or invitation token does not exist |
| `ConflictError` | 409 Conflict | Email already registered, tenant slug collision |

## Known Limitations / TODOs

- Multi-factor authentication (MFA/TOTP) secret column exists in schema but verification routes are pending v2 implementation.
- Redis-backed distributed token blacklist can replace in-memory `TokenRevocationStore` when scaling past a single node instance.

## Configuration

| Variable | Type | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | string | *required* | Secret key for HMAC SHA-256 JWT access token signing (min 32 chars) |
| `JWT_EXPIRES_IN` | string | `15m` | Lifetime for access tokens before requiring refresh |
| `REFRESH_TOKEN_SECRET` | string | *required* | Pepper/secret used for cryptographic refresh token derivation |
| `DATABASE_URL` | string | *required* | PostgreSQL connection string for pooled query execution |
| `DIRECT_URL` | string | *optional* | Direct PostgreSQL connection string for migrations |
