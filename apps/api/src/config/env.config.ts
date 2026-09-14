import 'dotenv/config';

export interface EnvConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  AXIOM_API_TOKEN?: string;
  AXIOM_DATASET: string;
  AXIOM_OTLP_ENDPOINT: string;
  LOG_LEVEL: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  PASSWORD_PEPPER: string;
}

export function loadEnvConfig(): EnvConfig {
  return {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
    HOST: process.env.HOST || '0.0.0.0',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'flowline-attachments',
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    AXIOM_API_TOKEN: process.env.AXIOM_API_TOKEN,
    AXIOM_DATASET: process.env.AXIOM_DATASET || 'flowline-dev',
    AXIOM_OTLP_ENDPOINT: process.env.AXIOM_OTLP_ENDPOINT || 'https://api.axiom.co/v1/logs',
    LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    JWT_SECRET: process.env.JWT_SECRET || 'flowline-super-secret-jwt-key-change-in-production-2026',
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || 'flowline-secret-pepper-2026'
  };
}

export const env = loadEnvConfig();

