import { randomUUID } from 'crypto';
import { mockDb } from '@flowline/mock-db';
import { User, TenantRole, TenantMember } from '@flowline/types';
import { pool } from '../../db/client.js';
import { env } from '../../config/env.config.js';
import { logger } from '../../shared/logger.js';
import { CompanyDto, UserRecord, TenantRecord, TenantMembershipDto } from './auth.types.js';

// Pre-seeded local memory store for development & mock fallback
const IN_MEMORY_TENANTS: Map<string, TenantRecord> = new Map([
  [
    'a0000000-0000-0000-0000-000000000001',
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Acme Corp',
      slug: 'acme-corp',
      plan: 'pro',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  [
    'b0000000-0000-0000-0000-000000000002',
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'Globex Inc',
      slug: 'globex',
      plan: 'enterprise',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
]);

const IN_MEMORY_USERS: Map<string, UserRecord> = new Map();
const IN_MEMORY_MEMBERSHIPS: TenantMember[] = [];
const IN_MEMORY_INVITATIONS: any[] = [];
const IN_MEMORY_AUDIT_LOGS: any[] = [];

export class AuthRepository {
  private hasDb(): boolean {
    return Boolean(env.DATABASE_URL);
  }

  public async simulateNetwork(): Promise<number> {
    return mockDb.simulateNetwork();
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (this.hasDb()) {
      try {
        const query = `
          SELECT id, email, password_hash as "passwordHash", full_name as "fullName", 
                 avatar_url as "avatarUrl", status, email_verified_at as "emailVerifiedAt", 
                 mfa_secret as "mfaSecret", created_at as "createdAt", updated_at as "updatedAt"
          FROM users 
          WHERE LOWER(email) = $1
          LIMIT 1;
        `;
        const res = await pool.query(query, [normalizedEmail]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err, email: normalizedEmail }, 'Database query failed in findUserByEmail, falling back to local store');
      }
    }

    for (const user of IN_MEMORY_USERS.values()) {
      if (user.email.toLowerCase() === normalizedEmail) {
        return { ...user };
      }
    }
    return null;
  }

  public async findUserById(userId: string): Promise<UserRecord | null> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT id, email, password_hash as "passwordHash", full_name as "fullName", 
                 avatar_url as "avatarUrl", status, email_verified_at as "emailVerifiedAt", 
                 mfa_secret as "mfaSecret", created_at as "createdAt", updated_at as "updatedAt"
          FROM users 
          WHERE id = $1
          LIMIT 1;
        `;
        const res = await pool.query(query, [userId]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err, userId }, 'Database query failed in findUserById, falling back to local store');
      }
    }

    const user = IN_MEMORY_USERS.get(userId);
    return user ? { ...user } : null;
  }

  public async createUser(user: {
    id?: string;
    email: string;
    passwordHash: string;
    fullName: string;
    avatarUrl?: string;
  }): Promise<UserRecord> {
    const id = user.id || randomUUID();
    const normalizedEmail = user.email.toLowerCase().trim();
    const now = new Date().toISOString();

    if (this.hasDb()) {
      try {
        const query = `
          INSERT INTO users (id, email, password_hash, full_name, avatar_url, status, email_verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW(), NOW())
          RETURNING id, email, password_hash as "passwordHash", full_name as "fullName", 
                    avatar_url as "avatarUrl", status, email_verified_at as "emailVerifiedAt", 
                    created_at as "createdAt", updated_at as "updatedAt";
        `;
        const res = await pool.query(query, [id, normalizedEmail, user.passwordHash, user.fullName, user.avatarUrl || null]);
        return res.rows[0];
      } catch (err) {
        logger.warn({ err }, 'DB insert failed in createUser, saving in memory store');
      }
    }

    const newRecord: UserRecord = {
      id,
      email: normalizedEmail,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      status: 'active',
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now
    };
    IN_MEMORY_USERS.set(id, newRecord);
    return newRecord;
  }

  public async createTenant(tenant: {
    name: string;
    slug: string;
    plan?: 'free' | 'pro' | 'enterprise';
  }): Promise<TenantRecord> {
    const id = randomUUID();
    const plan = tenant.plan || 'free';
    const now = new Date().toISOString();

    if (this.hasDb()) {
      try {
        const query = `
          INSERT INTO tenants (id, name, slug, plan, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt";
        `;
        const res = await pool.query(query, [id, tenant.name, tenant.slug, plan]);
        return res.rows[0];
      } catch (err) {
        logger.warn({ err }, 'DB insert failed in createTenant, saving in memory store');
      }
    }

    const newTenant: TenantRecord = {
      id,
      name: tenant.name,
      slug: tenant.slug,
      plan,
      createdAt: now,
      updatedAt: now
    };
    IN_MEMORY_TENANTS.set(id, newTenant);
    return newTenant;
  }

  public async findTenantById(tenantId: string): Promise<TenantRecord | null> {
    if (this.hasDb()) {
      try {
        const query = `SELECT id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt" FROM tenants WHERE id = $1 LIMIT 1;`;
        const res = await pool.query(query, [tenantId]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err, tenantId }, 'DB query failed in findTenantById');
      }
    }

    return IN_MEMORY_TENANTS.get(tenantId) || null;
  }

  public async findTenantBySlug(slug: string): Promise<TenantRecord | null> {
    if (this.hasDb()) {
      try {
        const query = `SELECT id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt" FROM tenants WHERE slug = $1 LIMIT 1;`;
        const res = await pool.query(query, [slug]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err, slug }, 'DB query failed in findTenantBySlug');
      }
    }

    for (const t of IN_MEMORY_TENANTS.values()) {
      if (t.slug === slug) return { ...t };
    }
    return null;
  }

  public async createTenantMember(params: {
    tenantId: string;
    userId: string;
    role: TenantRole;
  }): Promise<TenantMember> {
    const id = randomUUID();
    const now = new Date().toISOString();

    if (this.hasDb()) {
      try {
        const query = `
          INSERT INTO tenant_members (id, tenant_id, user_id, role, status, joined_at)
          VALUES ($1, $2, $3, $4, 'active', NOW())
          RETURNING id, tenant_id as "tenantId", user_id as "userId", role, status, joined_at as "joinedAt";
        `;
        const res = await pool.query(query, [id, params.tenantId, params.userId, params.role]);
        return res.rows[0];
      } catch (err) {
        logger.warn({ err }, 'DB insert failed in createTenantMember');
      }
    }

    const member: TenantMember = {
      id,
      tenantId: params.tenantId,
      userId: params.userId,
      role: params.role,
      status: 'active',
      joinedAt: now
    };
    IN_MEMORY_MEMBERSHIPS.push(member);
    return member;
  }

  public async findMembership(tenantId: string, userId: string): Promise<TenantMember | null> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT id, tenant_id as "tenantId", user_id as "userId", role, status, joined_at as "joinedAt"
          FROM tenant_members
          WHERE tenant_id = $1 AND user_id = $2
          LIMIT 1;
        `;
        const res = await pool.query(query, [tenantId, userId]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err }, 'DB query failed in findMembership');
      }
    }

    const mem = IN_MEMORY_MEMBERSHIPS.find(m => m.tenantId === tenantId && m.userId === userId);
    return mem ? { ...mem } : null;
  }

  public async getUserMemberships(userId: string): Promise<TenantMembershipDto[]> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT tm.tenant_id as "tenantId", tm.tenant_id as "companyId", t.name, t.slug, tm.role
          FROM tenant_members tm
          JOIN tenants t ON t.id = tm.tenant_id
          WHERE tm.user_id = $1 AND tm.status = 'active';
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
      } catch (err) {
        logger.warn({ err, userId }, 'DB query failed in getUserMemberships');
      }
    }

    const list: TenantMembershipDto[] = [];
    for (const mem of IN_MEMORY_MEMBERSHIPS) {
      if (mem.userId === userId && mem.status === 'active') {
        const tenant = IN_MEMORY_TENANTS.get(mem.tenantId);
        if (tenant) {
          list.push({
            tenantId: tenant.slug,
            companyId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            role: mem.role
          });
        }
      }
    }
    return list;
  }

  public async createInvitation(params: {
    tenantId: string;
    email: string;
    role: TenantRole;
    tokenHash: string;
    invitedBy?: string;
    expiresAt: Date;
  }): Promise<any> {
    const id = randomUUID();
    const normalizedEmail = params.email.toLowerCase().trim();

    if (this.hasDb()) {
      try {
        const query = `
          INSERT INTO invitations (id, tenant_id, email, role, token_hash, invited_by, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, tenant_id as "tenantId", email, role, token_hash as "tokenHash", invited_by as "invitedBy", expires_at as "expiresAt";
        `;
        const res = await pool.query(query, [
          id,
          params.tenantId,
          normalizedEmail,
          params.role,
          params.tokenHash,
          params.invitedBy || null,
          params.expiresAt
        ]);
        return res.rows[0];
      } catch (err) {
        logger.warn({ err }, 'DB insert failed in createInvitation');
      }
    }

    const inv = {
      id,
      tenantId: params.tenantId,
      email: normalizedEmail,
      role: params.role,
      tokenHash: params.tokenHash,
      invitedBy: params.invitedBy,
      expiresAt: params.expiresAt,
      acceptedAt: null,
      createdAt: new Date().toISOString()
    };
    IN_MEMORY_INVITATIONS.push(inv);
    return inv;
  }

  public async findInvitationByTokenHash(tokenHash: string): Promise<any | null> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT id, tenant_id as "tenantId", email, role, token_hash as "tokenHash", 
                 invited_by as "invitedBy", expires_at as "expiresAt", accepted_at as "acceptedAt"
          FROM invitations
          WHERE token_hash = $1
          LIMIT 1;
        `;
        const res = await pool.query(query, [tokenHash]);
        return res.rows[0] || null;
      } catch (err) {
        logger.warn({ err }, 'DB query failed in findInvitationByTokenHash');
      }
    }

    const inv = IN_MEMORY_INVITATIONS.find(i => i.tokenHash === tokenHash);
    return inv || null;
  }

  public async markInvitationAccepted(id: string): Promise<void> {
    if (this.hasDb()) {
      try {
        await pool.query(`UPDATE invitations SET accepted_at = NOW() WHERE id = $1;`, [id]);
        return;
      } catch (err) {
        logger.warn({ err }, 'DB update failed in markInvitationAccepted');
      }
    }

    const inv = IN_MEMORY_INVITATIONS.find(i => i.id === id);
    if (inv) inv.acceptedAt = new Date().toISOString();
  }

  public async writeAuditLog(params: {
    tenantId?: string;
    userId?: string;
    action: string;
    ip?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<void> {
    if (this.hasDb()) {
      try {
        const query = `
          INSERT INTO auth_audit_log (id, tenant_id, user_id, action, ip, user_agent, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;
        await pool.query(query, [
          randomUUID(),
          params.tenantId || null,
          params.userId || null,
          params.action,
          params.ip || null,
          params.userAgent || null,
          JSON.stringify(params.metadata || {})
        ]);
        return;
      } catch (err) {
        logger.warn({ err }, 'DB insert failed in writeAuditLog');
      }
    }

    IN_MEMORY_AUDIT_LOGS.push({
      id: randomUUID(),
      ...params,
      createdAt: new Date().toISOString()
    });
  }

  public async findTenantMembers(tenantId: string): Promise<any[]> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT tm.id, tm.tenant_id as "tenantId", tm.user_id as "userId",
                 COALESCE(tr.name, tm.role) as "role", tm.joined_at as "joinedAt",
                 u.email, u.full_name as "fullName", u.avatar_url as "avatarUrl", u.status
          FROM tenant_members tm
          JOIN users u ON tm.user_id = u.id
          LEFT JOIN tenant_roles tr ON tm.tenant_role_id = tr.id
          WHERE (tm.tenant_id = $1 OR tm.tenant_id::text = $1)
          ORDER BY tm.joined_at ASC;
        `;
        const res = await pool.query(query, [tenantId]);
        return res.rows;
      } catch (err) {
        logger.warn({ err, tenantId }, 'DB query failed in findTenantMembers');
      }
    }

    return IN_MEMORY_MEMBERSHIPS.filter(m => m.tenantId === tenantId).map(m => ({
      id: m.id,
      tenantId: m.tenantId,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt
    }));
  }

  public async countTenantOwners(tenantId: string): Promise<number> {
    if (this.hasDb()) {
      try {
        const query = `
          SELECT COUNT(*)::int as count
          FROM tenant_members tm
          LEFT JOIN tenant_roles tr ON tm.tenant_role_id = tr.id
          WHERE (tm.tenant_id = $1 OR tm.tenant_id::text = $1)
            AND (LOWER(COALESCE(tr.name, tm.role)) = 'owner');
        `;
        const res = await pool.query(query, [tenantId]);
        return res.rows[0]?.count || 0;
      } catch (err) {
        logger.warn({ err, tenantId }, 'DB query failed in countTenantOwners');
      }
    }

    return IN_MEMORY_MEMBERSHIPS.filter(m => m.tenantId === tenantId && m.role === 'owner').length || 1;
  }

  public async updateMemberRole(tenantId: string, userId: string, newRole: TenantRole): Promise<void> {
    if (this.hasDb()) {
      try {
        // Resolve role ID if exists
        const roleRes = await pool.query(
          `SELECT id FROM tenant_roles WHERE (tenant_id = $1 OR tenant_id IS NULL) AND name = $2 LIMIT 1;`,
          [tenantId, newRole]
        );
        const roleId = roleRes.rows[0]?.id || null;

        await pool.query(
          `UPDATE tenant_members 
           SET role = $1, tenant_role_id = $2 
           WHERE user_id = $3 AND (tenant_id = $4 OR tenant_id::text = $4);`,
          [newRole, roleId, userId, tenantId]
        );
        return;
      } catch (err) {
        logger.warn({ err, userId, tenantId, newRole }, 'DB query failed in updateMemberRole');
      }
    }

    const m = IN_MEMORY_MEMBERSHIPS.find(mem => mem.tenantId === tenantId && mem.userId === userId);
    if (m) m.role = newRole;
  }

  public async removeTenantMember(tenantId: string, userId: string): Promise<void> {
    if (this.hasDb()) {
      try {
        await pool.query(
          `DELETE FROM tenant_members WHERE user_id = $1 AND (tenant_id = $2 OR tenant_id::text = $2);`,
          [userId, tenantId]
        );
        return;
      } catch (err) {
        logger.warn({ err, userId, tenantId }, 'DB query failed in removeTenantMember');
      }
    }

    const idx = IN_MEMORY_MEMBERSHIPS.findIndex(m => m.tenantId === tenantId && m.userId === userId);
    if (idx !== -1) IN_MEMORY_MEMBERSHIPS.splice(idx, 1);
  }

  public getUsers(): User[] {
    return mockDb.getUsers();
  }

  public getCompanies(): CompanyDto[] {
    const list: CompanyDto[] = [];
    for (const t of IN_MEMORY_TENANTS.values()) {
      list.push({
        id: t.id,
        tenantId: t.slug,
        name: t.name,
        plan: t.plan
      });
    }
    return list;
  }
}

export const authRepository = new AuthRepository();
