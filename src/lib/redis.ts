import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://default:RabbitRedis2026!@rabbithub-redis:6379', {
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
    const data = await getRedis().get(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // Non-critical, continue without cache
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key)
  } catch {
    // Non-critical
  }
}

// Rate limiting with sliding window (Redis-backed)
export async function redisRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const r = getRedis()
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  try {
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
  } catch {
    // If Redis fails, allow the request
    return { allowed: true, remaining: limit, resetAt: now + windowSeconds * 1000 }
  }
}
