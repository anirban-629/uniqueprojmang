import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.config.js';

// Precomputed dummy hash for timing-attack mitigation on non-existent user login
const DUMMY_SALT = bcrypt.genSaltSync(12);
const DUMMY_HASH = bcrypt.hashSync(`flowline-dummy-credential-${env.PASSWORD_PEPPER}`, DUMMY_SALT);

/**
 * Apply server-side HMAC pepper before hashing to protect against raw DB dump cracking.
 */
function applyPepper(password: string): string {
  return crypto
    .createHmac('sha256', env.PASSWORD_PEPPER)
    .update(password)
    .digest('hex');
}

/**
 * Hash a plaintext password with server pepper and bcrypt salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const peppered = applyPepper(password);
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(peppered, salt);
}

/**
 * Timing-safe comparison of a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash?: string | null): Promise<boolean> {
  const targetHash = storedHash || DUMMY_HASH;
  const peppered = applyPepper(password);
  const isValid = await bcrypt.compare(peppered, targetHash);
  
  if (!storedHash) {
    return false;
  }
  return isValid;
}

/**
 * Computes a SHA-256 hash of a token (e.g. refresh token or invite token) for safe storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token string.
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Timing-safe string comparison.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
