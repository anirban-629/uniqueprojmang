import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment from package or root
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const isRemote = connectionString?.includes('supabase') || connectionString?.includes('neon') || connectionString?.includes('pooler');

export const pool = new Pool({
  connectionString,
  ssl: isRemote || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

/**
 * Executes a callback inside a transaction scoped to a specific tenant using Postgres RLS.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper to execute a query directly.
 */
export async function query<R extends QueryResultRow = any, I extends any[] = any[]>(
  text: string,
  params?: I
): Promise<QueryResult<R>> {
  return pool.query<R>(text, params);
}
