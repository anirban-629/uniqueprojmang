import pino, { Logger } from 'pino';
import pretty from 'pino-pretty';
import { Writable } from 'stream';
import { env } from '../config/env.config.js';

function createAxiomStream(): Writable | null {
  if (!env.AXIOM_API_TOKEN) {
    return null;
  }

  const token = env.AXIOM_API_TOKEN;
  const dataset = env.AXIOM_DATASET || 'flowline-dev';
  const endpoint = `https://api.axiom.co/v1/datasets/${dataset}/ingest`;

  const buffer: Record<string, unknown>[] = [];
  let flushTimer: NodeJS.Timeout | null = null;

  async function flush() {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      });
    } catch (err: any) {
      // Avoid crashing process on network blip
      console.error('[Axiom Stream Error]', err?.message || err);
    }
  }

  return new Writable({
    objectMode: false,
    write(chunk, _encoding, callback) {
      try {
        const parsed = JSON.parse(chunk.toString());
        const levelMap: Record<number, string> = {
          10: 'trace',
          20: 'debug',
          30: 'info',
          40: 'warn',
          50: 'error',
          60: 'fatal'
        };

        buffer.push({
          _time: parsed.time ? new Date(parsed.time).toISOString() : new Date().toISOString(),
          level: levelMap[parsed.level] || 'info',
          message: parsed.msg,
          ...parsed
        });

        if (!flushTimer) {
          flushTimer = setTimeout(() => {
            flushTimer = null;
            flush();
          }, 200);
        }
      } catch {
        // ignore malformed JSON
      }
      callback();
    }
  });
}

function buildLogger(): Logger {
  const streams: pino.StreamEntry[] = [];

  // 1. Console Stream (pretty printed in dev, stdout in prod)
  if (env.NODE_ENV !== 'production') {
    streams.push({
      stream: pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }),
      level: (env.LOG_LEVEL as any) || 'debug'
    });
  } else {
    streams.push({
      stream: process.stdout,
      level: (env.LOG_LEVEL as any) || 'info'
    });
  }

  // 2. Axiom Remote Stream (when API token configured)
  const axiomStream = createAxiomStream();
  if (axiomStream) {
    streams.push({
      stream: axiomStream,
      level: (env.LOG_LEVEL as any) || 'info'
    });
  }

  return pino(
    {
      level: env.LOG_LEVEL || 'info',
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers["x-company-id"]',
          'req.headers["x-tenant-id"]',
          '*.password',
          '*.token',
          '*.secret',
          '*.apiKey'
        ],
        censor: '[REDACTED]'
      }
    },
    pino.multistream(streams)
  );
}

export const logger: Logger = buildLogger();

export function createChildLogger(moduleName: string, metadata: Record<string, unknown> = {}): Logger {
  return logger.child({
    module: moduleName,
    ...metadata
  });
}
