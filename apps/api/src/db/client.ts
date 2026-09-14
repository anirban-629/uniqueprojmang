import pg from 'pg';

const { Pool } = pg;

export function cleanPostgresUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return rawUrl;
  try {
    new URL(rawUrl);
    return rawUrl;
  } catch {
    const match = rawUrl.match(/^(postgres(?:ql)?:\/\/)([^:]+):(.*)@([^@\/:]+)(?::(\d+))?(\/.*)?$/);
    if (match) {
      const [, prefix, user, pass, host, port, rest] = match;
      const encodedPass = encodeURIComponent(pass);
      return `${prefix}${user}:${encodedPass}@${host}${port ? `:${port}` : ''}${rest || ''}`;
    }
    return rawUrl;
  }
}

const connectionString = cleanPostgresUrl(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

export async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number; version?: string; error?: string }> {
  const start = Date.now();
  try {
    const res = await pool.query('SELECT 1 as healthy, version();');
    const latencyMs = Date.now() - start;
    return {
      status: 'healthy',
      latencyMs,
      version: res.rows[0]?.version?.split(' on ')[0]
    };
  } catch (err: any) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: err.message
    };
  }
}
