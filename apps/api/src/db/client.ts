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

pool.on('error', (err) => {
  // Prevent unhandled background idle client drops from terminating the process
  console.warn('[DB Pool] Idle client error:', err.message);
});

const directConnectionString = cleanPostgresUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);

export const directPool = new Pool({
  connectionString: directConnectionString,
  ssl: directConnectionString?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

directPool.on('error', (err) => {
  console.warn('[DB Direct Pool] Idle client error:', err.message);
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
