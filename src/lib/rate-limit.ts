// Rate limiter with Redis-backed sliding window (falls back to in-memory)
// Tracks requests per key (user ID or IP) with sliding window

import { redisRateLimit } from '@/lib/redis'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitConfig {
  maxRequests: number  // Max requests in window
  windowMs: number     // Window duration in milliseconds
}

// Default configs for different endpoints
export const RATE_LIMITS = {
  chat: { maxRequests: 30, windowMs: 60 * 1000 },       // 30 req/min
  image: { maxRequests: 10, windowMs: 60 * 1000 },      // 10 req/min
  video: { maxRequests: 5, windowMs: 60 * 1000 },       // 5 req/min
  payment: { maxRequests: 20, windowMs: 60 * 1000 },    // 20 req/min
  auth: { maxRequests: 10, windowMs: 5 * 60 * 1000 },   // 10 req/5min
  general: { maxRequests: 60, windowMs: 60 * 1000 },    // 60 req/min
} as const

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup()

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // No existing entry or expired window
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    }
  }

  // Within window
  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  }
}

// Helper to get rate limit key from request
export function getRateLimitKey(
  request: Request,
  userId?: string,
  prefix?: string
): string {
  const parts = [prefix || 'rl']

  if (userId) {
    parts.push(`user:${userId}`)
  } else {
    // Fallback to IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
    parts.push(`ip:${ip}`)
  }

  return parts.join(':')
}

// Apply rate limit headers to response
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
): void {
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString())
}

/**
 * Redis-backed rate limiting with sliding window.
 * Falls back to in-memory if Redis is unavailable.
 * Use this for Node.js API routes (not Edge middleware).
 */
export async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(config.windowMs / 1000)
  const redisKey = `rl:${key}`

  try {
    const result = await redisRateLimit(redisKey, config.maxRequests, windowSeconds)
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit: config.maxRequests,
    }
  } catch {
    // Fallback to in-memory rate limiting
    return checkRateLimit(key, config)
  }
}
