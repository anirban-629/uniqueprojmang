import { randomUUID } from 'crypto';
import { User, TenantRole, TenantMember } from '@flowline/types';
import { pool } from '../../db/client.js';
import { CompanyDto, UserRecord, TenantRecord, TenantMembershipDto } from './auth.types.js';

export class AuthRepository {
  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.toLowerCase().trim();
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
  }

  public async findUserById(userId: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", full_name as "fullName", 
             avatar_url as "avatarUrl", status, email_verified_at as "emailVerifiedAt", 
             mfa_secret as "mfaSecret", created_at as "createdAt", updated_at as "updatedAt"
      FROM users 
      WHERE id = $1 OR id::text = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [userId]);
    return res.rows[0] || null;
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
    const query = `
      INSERT INTO users (id, email, password_hash, full_name, avatar_url, status, email_verified_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW(), NOW())
      RETURNING id, email, password_hash as "passwordHash", full_name as "fullName", 
                avatar_url as "avatarUrl", status, email_verified_at as "emailVerifiedAt", 
                created_at as "createdAt", updated_at as "updatedAt";
    `;
    const res = await pool.query(query, [id, normalizedEmail, user.passwordHash, user.fullName, user.avatarUrl || null]);
    return res.rows[0];
  }

  public async createTenant(tenant: {
    name: string;
    slug: string;
    plan?: 'free' | 'pro' | 'enterprise';
  }): Promise<TenantRecord> {
    const id = randomUUID();
    const plan = tenant.plan || 'free';
    const query = `
      INSERT INTO tenants (id, name, slug, plan, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt";
    `;
    const res = await pool.query(query, [id, tenant.name, tenant.slug, plan]);
    return res.rows[0];
  }

  public async findTenantById(tenantId: string): Promise<TenantRecord | null> {
    const query = `SELECT id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt" FROM tenants WHERE id = $1 OR id::text = $1 LIMIT 1;`;
    const res = await pool.query(query, [tenantId]);
    return res.rows[0] || null;
  }

  public async findTenantBySlug(slug: string): Promise<TenantRecord | null> {
    const query = `SELECT id, name, slug, plan, created_at as "createdAt", updated_at as "updatedAt" FROM tenants WHERE slug = $1 LIMIT 1;`;
    const res = await pool.query(query, [slug]);
    return res.rows[0] || null;
  }

  public async createTenantMember(params: {
    tenantId: string;
    userId: string;
    role: TenantRole;
  }): Promise<TenantMember> {
    const id = randomUUID();
    const query = `
      INSERT INTO tenant_members (id, tenant_id, user_id, role, status, joined_at)
      VALUES ($1, $2, $3, $4, 'active', NOW())
      RETURNING id, tenant_id as "tenantId", user_id as "userId", role, status, joined_at as "joinedAt";
    `;
    const res = await pool.query(query, [id, params.tenantId, params.userId, params.role]);
    return res.rows[0];
  }

  public async findMembership(tenantId: string, userId: string): Promise<TenantMember | null> {
    const query = `
      SELECT id, tenant_id as "tenantId", user_id as "userId", role, status, joined_at as "joinedAt"
      FROM tenant_members
      WHERE (tenant_id = $1 OR tenant_id::text = $1) AND (user_id = $2 OR user_id::text = $2)
      LIMIT 1;
    `;
    const res = await pool.query(query, [tenantId, userId]);
    return res.rows[0] || null;
  }

  public async getUserMemberships(userId: string): Promise<TenantMembershipDto[]> {
    const query = `
      SELECT tm.tenant_id as "tenantId", tm.tenant_id as "companyId", t.name, t.slug, tm.role
      FROM tenant_members tm
      JOIN tenants t ON t.id = tm.tenant_id
      WHERE (tm.user_id = $1 OR tm.user_id::text = $1) AND tm.status = 'active';
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
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
  }

  public async findInvitationByTokenHash(tokenHash: string): Promise<any | null> {
    const query = `
      SELECT id, tenant_id as "tenantId", email, role, token_hash as "tokenHash", 
             invited_by as "invitedBy", expires_at as "expiresAt", accepted_at as "acceptedAt"
      FROM invitations
      WHERE token_hash = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [tokenHash]);
    return res.rows[0] || null;
  }

  public async markInvitationAccepted(id: string): Promise<void> {
    await pool.query(`UPDATE invitations SET accepted_at = NOW() WHERE id = $1;`, [id]);
  }

  public async writeAuditLog(params: {
    tenantId?: string;
    userId?: string;
    action: string;
    ip?: string;
    userAgent?: string;
    metadata?: any;
  }): Promise<void> {
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
  }

  public async findTenantMembers(tenantId: string): Promise<any[]> {
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
  }

  public async countTenantOwners(tenantId: string): Promise<number> {
    const query = `
      SELECT COUNT(*)::int as count
      FROM tenant_members tm
      LEFT JOIN tenant_roles tr ON tm.tenant_role_id = tr.id
      WHERE (tm.tenant_id = $1 OR tm.tenant_id::text = $1)
        AND (LOWER(COALESCE(tr.name, tm.role)) = 'owner');
    `;
    const res = await pool.query(query, [tenantId]);
    return res.rows[0]?.count || 0;
  }

  public async updateMemberRole(tenantId: string, userId: string, newRole: TenantRole): Promise<void> {
    const roleRes = await pool.query(
      `SELECT id FROM tenant_roles WHERE (tenant_id = $1 OR tenant_id IS NULL) AND name = $2 LIMIT 1;`,
      [tenantId, newRole]
    );
    const roleId = roleRes.rows[0]?.id || null;

    await pool.query(
      `UPDATE tenant_members 
       SET role = $1, tenant_role_id = $2 
       WHERE (user_id = $3 OR user_id::text = $3) AND (tenant_id = $4 OR tenant_id::text = $4);`,
      [newRole, roleId, userId, tenantId]
    );
  }

  public async removeTenantMember(tenantId: string, userId: string): Promise<void> {
    await pool.query(
      `DELETE FROM tenant_members WHERE (user_id = $1 OR user_id::text = $1) AND (tenant_id = $2 OR tenant_id::text = $2);`,
      [userId, tenantId]
    );
  }

  public async getUsers(): Promise<User[]> {
    const res = await pool.query(`
      SELECT id, full_name as "name", email, COALESCE(avatar_url, '') as "avatar",
             'engineer' as "role", 'team-platform' as "teamId"
      FROM users
      ORDER BY full_name ASC;
    `);
    return res.rows;
  }

  public async getCompanies(): Promise<CompanyDto[]> {
    const res = await pool.query(`
      SELECT id, slug as "tenantId", name, plan
      FROM tenants
      ORDER BY name ASC;
    `);
    return res.rows;
  }
}

export const authRepository = new AuthRepository();
