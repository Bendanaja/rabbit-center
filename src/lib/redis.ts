import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      console.error('[Redis] REDIS_URL environment variable is not set. Redis is disabled; in-memory fallback will be used.')
      return null
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message)
    })
  }
  return redis
}

// Cache helpers
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis()
    if (!r) return null
    const data = await r.get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // Non-critical, continue without cache
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.del(key)
  } catch {
    // Non-critical
  }
}

// Budget reservation helpers for atomic pre-reserve / adjust pattern.
// Returns the new total after incrementing, or null if Redis is unavailable.
export async function redisIncrByFloat(key: string, amount: number, ttlSeconds?: number): Promise<number | null> {
  try {
    const r = getRedis()
    if (!r) return null
    const newVal = await r.incrbyfloat(key, amount)
    if (ttlSeconds) {
      // Only set TTL if the key doesn't already have one (first reservation of the month)
      const currentTtl = await r.ttl(key)
      if (currentTtl < 0) {
        await r.expire(key, ttlSeconds)
      }
    }
    return parseFloat(String(newVal))
  } catch {
    return null
  }
}

// Rate limiting with sliding window (Redis-backed).
// Throws on Redis failure so the caller can fall back to in-memory limiting.
export async function redisRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const r = getRedis()
  if (!r) {
    throw new Error('Redis unavailable')
  }

  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  const pipeline = r.pipeline()
  // Remove old entries
  pipeline.zremrangebyscore(key, 0, windowStart)
  // Add current request
  pipeline.zadd(key, now.toString(), `${now}-${Math.random()}`)
  // Count requests in window
  pipeline.zcard(key)
  // Set expiry on the key
  pipeline.expire(key, windowSeconds)

  const results = await pipeline.exec()
  const count = (results?.[2]?.[1] as number) || 0

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowSeconds * 1000,
  }
}
