export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unconfigured';
  latencyMs?: number;
  version?: string;
  bucket?: string;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  services: {
    database: ServiceHealth;
    storage: ServiceHealth;
    redis: ServiceHealth;
  };
  system: {
    nodeVersion: string;
    memoryRssMb: number;
    memoryHeapUsedMb: number;
  };
}
