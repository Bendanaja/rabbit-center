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
  chat: { maxRequests: 200, windowMs: 60 * 1000 },      // 200 req/min
  image: { maxRequests: 50, windowMs: 60 * 1000 },      // 50 req/min
  video: { maxRequests: 20, windowMs: 60 * 1000 },      // 20 req/min
  search: { maxRequests: 60, windowMs: 60 * 1000 },     // 60 req/min
  payment: { maxRequests: 50, windowMs: 60 * 1000 },    // 50 req/min
  auth: { maxRequests: 30, windowMs: 5 * 60 * 1000 },   // 30 req/5min
  general: { maxRequests: 500, windowMs: 60 * 1000 },   // 500 req/min
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
    const ip = forwarded?.split(',').pop()?.trim() || 'unknown'
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

type RateLimitType = 'chat' | 'image' | 'video' | 'search'

const RATE_TYPE_TO_COLUMN: Record<RateLimitType, string> = {
  chat: 'rate_chat_per_min',
  image: 'rate_image_per_min',
  video: 'rate_video_per_min',
  search: 'rate_search_per_min',
}

/**
 * Get rate limit config for a user based on their plan.
 * Checks plan_overrides table for admin-configured limits, falls back to RATE_LIMITS defaults.
 * Requires the user's planId — call getUserPlan() first to get it.
 * Reuses getPlanOverrides() to avoid duplicate DB queries.
 */
export async function getUserRateLimitConfig(
  userId: string,
  type: RateLimitType
): Promise<RateLimitConfig> {
  // Import dynamically to avoid circular deps at module level
  const { getUserPlan, getPlanOverrides } = await import('@/lib/plan-limits')
  const userPlan = await getUserPlan(userId)
  const overrides = await getPlanOverrides(userPlan.planId)

  if (overrides) {
    const column = RATE_TYPE_TO_COLUMN[type]
    const customValue = overrides[column as keyof typeof overrides] as number | null

    if (customValue != null && customValue > 0) {
      return { maxRequests: customValue, windowMs: 60 * 1000 }
    }
  }

  return RATE_LIMITS[type]
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
