import { checkDatabaseHealth } from '../db/client.js';
import { env } from '../config/env.config.js';
import { HealthCheckResult, ServiceHealth } from './health.types.js';

export class HealthService {
  public async checkDb(): Promise<ServiceHealth> {
    return checkDatabaseHealth();
  }

  public async checkStorage(): Promise<ServiceHealth> {
    const start = Date.now();
    const supabaseUrl = env.SUPABASE_URL;
    const secretKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_PUBLISHABLE_KEY;
    const bucket = env.SUPABASE_STORAGE_BUCKET;

    if (!supabaseUrl || !secretKey) {
      return { status: 'unconfigured' };
    }

    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        headers: {
          apikey: secretKey,
          Authorization: `Bearer ${secretKey}`
        }
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { status: 'healthy', latencyMs, bucket };
      }
      return { status: 'unhealthy', latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { status: 'unhealthy', latencyMs: Date.now() - start, error: err.message };
    }
  }

  public async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      return { status: 'unconfigured' };
    }

    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: {
          Authorization: `Bearer ${redisToken}`
        }
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { status: 'healthy', latencyMs };
      }
      return { status: 'unhealthy', latencyMs, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: 'unhealthy', latencyMs: Date.now() - start, error: err.message };
    }
  }

  public async getFullHealth(): Promise<HealthCheckResult> {
    const [dbHealth, storageHealth, redisHealth] = await Promise.all([
      this.checkDb(),
      this.checkStorage(),
      this.checkRedis()
    ]);

    const isHealthy = dbHealth.status === 'healthy';
    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
    const memoryUsage = process.memoryUsage();

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      services: {
        database: dbHealth,
        storage: storageHealth,
        redis: redisHealth
      },
      system: {
        nodeVersion: process.version,
        memoryRssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 10) / 10,
        memoryHeapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 10) / 10
      }
    };
  }
}

export const healthService = new HealthService();
