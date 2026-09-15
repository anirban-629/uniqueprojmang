import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config.js';
import { TenantRole } from '@flowline/types';
import { hashToken } from './auth.crypto.js';

export interface JwtAuthPayload {
  sub: string;            // User ID
  tenant_id: string;      // Active Tenant slug / ID
  company_id: string;     // Active Tenant UUID
  role: TenantRole;       // Member role in active tenant
  email: string;
  jti: string;            // Unique Token ID for revocation
  iss: string;
  aud: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tenantId: string;
  tokenHash: string;
  familyId: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * In-memory Revocation store for blacklisted access tokens (jti) and active refresh token families.
 * Automatically evicts expired items.
 */
class TokenRevocationStore {
  private revokedJtis = new Map<string, number>(); // jti -> expiresAtTimestamp
  private refreshTokens = new Map<string, RefreshTokenRecord>(); // tokenHash -> record

  constructor() {
    // Periodic sweep every 5 minutes
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref();
  }

  public revokeJti(jti: string, expiresAtTimestamp: number): void {
    this.revokedJtis.set(jti, expiresAtTimestamp);
  }

  public isJtiRevoked(jti: string): boolean {
    const expiresAt = this.revokedJtis.get(jti);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      this.revokedJtis.delete(jti);
      return false;
    }
    return true;
  }

  public storeRefreshToken(record: RefreshTokenRecord): void {
    this.refreshTokens.set(record.tokenHash, record);
  }

  public getRefreshToken(tokenHash: string): RefreshTokenRecord | undefined {
    const record = this.refreshTokens.get(tokenHash);
    if (!record) return undefined;
    if (new Date() > record.expiresAt) {
      this.refreshTokens.delete(tokenHash);
      return undefined;
    }
    return record;
  }

  public revokeTokenFamily(familyId: string): void {
    for (const [hash, record] of this.refreshTokens.entries()) {
      if (record.familyId === familyId) {
        record.isRevoked = true;
        this.refreshTokens.set(hash, record);
      }
    }
  }

  public revokeUserSessions(userId: string): void {
    for (const [hash, record] of this.refreshTokens.entries()) {
      if (record.userId === userId) {
        record.isRevoked = true;
        this.refreshTokens.set(hash, record);
      }
    }
  }

  public listUserSessions(userId: string): RefreshTokenRecord[] {
    const sessions: RefreshTokenRecord[] = [];
    const now = new Date();
    for (const record of this.refreshTokens.values()) {
      if (record.userId === userId && !record.isRevoked && record.expiresAt > now) {
        sessions.push(record);
      }
    }
    return sessions;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [jti, exp] of this.revokedJtis.entries()) {
      if (now > exp) {
        this.revokedJtis.delete(jti);
      }
    }
    const nowDate = new Date();
    for (const [hash, record] of this.refreshTokens.entries()) {
      if (nowDate > record.expiresAt) {
        this.refreshTokens.delete(hash);
      }
    }
  }
}

export const tokenStore = new TokenRevocationStore();

/**
 * Sign a new short-lived access JWT token with embedded tenant context and jti.
 */
export function signAccessToken(params: {
  userId: string;
  tenantId: string;
  companyId: string;
  role: TenantRole;
  email: string;
}): { token: string; jti: string; expiresIn: string } {
  const jti = randomUUID();
  const payload: Omit<JwtAuthPayload, 'iat' | 'exp'> = {
    sub: params.userId,
    tenant_id: params.tenantId,
    company_id: params.companyId,
    role: params.role,
    email: params.email,
    jti,
    iss: 'flowline-api',
    aud: 'flowline-app'
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    algorithm: 'HS256'
  });

  return { token, jti, expiresIn: env.JWT_ACCESS_EXPIRES_IN };
}

/**
 * Verify and decode an incoming access token, ensuring valid signature, claims, and non-revoked jti.
 */
export function verifyAccessToken(token: string): JwtAuthPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: 'flowline-api',
    audience: 'flowline-app',
    algorithms: ['HS256']
  }) as JwtAuthPayload;

  if (tokenStore.isJtiRevoked(decoded.jti)) {
    throw new Error('Token has been revoked');
  }

  return decoded;
}

/**
 * Issue a rotating refresh token tied to a session family.
 */
export function createRefreshToken(params: {
  userId: string;
  tenantId: string;
  familyId?: string;
}): { rawToken: string; familyId: string; expiresAt: Date } {
  const rawToken = `fl_rt_${randomUUID()}_${randomUUID()}`;
  const familyId = params.familyId || randomUUID();
  
  // Parse expiration days from env (default 30 days)
  const days = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const tokenRecord: RefreshTokenRecord = {
    id: randomUUID(),
    userId: params.userId,
    tenantId: params.tenantId,
    tokenHash: hashToken(rawToken),
    familyId,
    isRevoked: false,
    expiresAt,
    createdAt: new Date()
  };

  tokenStore.storeRefreshToken(tokenRecord);

  return { rawToken, familyId, expiresAt };
}
