import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '@utils/logger.js';

/* ------------------------------------------------------------------ */
/*  Redis client (optional — degrades to no-op when unconfigured)     */
/* ------------------------------------------------------------------ */

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info({ eventType: 'REDIS_CONNECTED' }, 'Redis connected');
  });

  redis.on('error', (err) => {
    logger.error({ eventType: 'REDIS_ERROR', error: err.message }, 'Redis error');
  });
}

/* ------------------------------------------------------------------ */
/*  Cache helpers — safe no-ops when Redis is unavailable             */
/* ------------------------------------------------------------------ */

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Cache write failure is non-critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Cache delete failure is non-critical
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache delete failure is non-critical
  }
}

export async function disconnectCache(): Promise<void> {
  if (redis) {
    await redis.quit();
  }
}

export { redis };
