// Security utilities for input validation, sanitization, and brute force protection

// ─── Input Length Limits ─────────────────────────────────
export const INPUT_LIMITS = {
  prompt: 4000,
  message: 8000,
  title: 200,
  email: 254,
  password: 128,
  fullName: 100,
  modelId: 100,
  chatId: 100,
  taskId: 200,
  searchQuery: 200,
  payload: 5000,
  imageBase64: 10_000_000, // ~10MB base64
} as const

// ─── Sanitize Input ──────────────────────────────────────
// Strips HTML/script tags from user input to prevent stored XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?(script|iframe|object|embed|form|input|textarea|button|select|option|link|style|meta|base|applet)[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
}

// ─── Validate Input ──────────────────────────────────────
// Validates input type and length, returns error message or null
export function validateInput(
  value: unknown,
  options: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    maxLength?: number
    minLength?: number
    required?: boolean
    fieldName?: string
  }
): string | null {
  const name = options.fieldName || 'Field'

  if (options.required && (value === undefined || value === null || value === '')) {
    return `${name} is required`
  }

  if (value === undefined || value === null) {
    return null // not required and not provided
  }

  if (options.type === 'string') {
    if (typeof value !== 'string') {
      return `${name} must be a string`
    }
    if (options.maxLength && value.length > options.maxLength) {
      return `${name} exceeds maximum length of ${options.maxLength} characters`
    }
    if (options.minLength && value.length < options.minLength) {
      return `${name} must be at least ${options.minLength} characters`
    }
  }

  if (options.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${name} must be a number`
    }
  }

  if (options.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return `${name} must be a boolean`
    }
  }

  if (options.type === 'array') {
    if (!Array.isArray(value)) {
      return `${name} must be an array`
    }
  }

  if (options.type === 'object') {
    if (typeof value !== 'object' || Array.isArray(value)) {
      return `${name} must be an object`
    }
  }

  return null
}

// Batch validate multiple fields
export function validateFields(
  fields: Array<{
    value: unknown
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    maxLength?: number
    minLength?: number
    required?: boolean
    fieldName: string
  }>
): string | null {
  for (const field of fields) {
    const error = validateInput(field.value, field)
    if (error) return error
  }
  return null
}

// ─── Content-Type Validation ─────────────────────────────
export function validateContentType(request: Request): string | null {
  const contentType = request.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    return 'Content-Type must be application/json'
  }
  return null
}

// ─── Brute Force Protection ──────────────────────────────
interface LoginAttempt {
  count: number
  firstAttempt: number
  lockedUntil: number | null
}

const loginAttemptStore = new Map<string, LoginAttempt>()

const BRUTE_FORCE_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockDurationMs: 15 * 60 * 1000, // 15 minutes lock
}

// Clean up expired entries periodically
let bruteForceCleanupInterval: ReturnType<typeof setInterval> | null = null

function startBruteForceCleanup() {
  if (bruteForceCleanupInterval) return
  bruteForceCleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, attempt] of loginAttemptStore) {
      if (
        (attempt.lockedUntil && now > attempt.lockedUntil) ||
        (now - attempt.firstAttempt > BRUTE_FORCE_CONFIG.windowMs)
      ) {
        loginAttemptStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export function checkBruteForce(ip: string): { allowed: boolean; retryAfterMs?: number } {
  startBruteForceCleanup()
  const now = Date.now()
  const attempt = loginAttemptStore.get(ip)

  if (!attempt) {
    return { allowed: true }
  }

  // Check if currently locked
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    return { allowed: false, retryAfterMs: attempt.lockedUntil - now }
  }

  // Check if window expired, reset
  if (now - attempt.firstAttempt > BRUTE_FORCE_CONFIG.windowMs) {
    loginAttemptStore.delete(ip)
    return { allowed: true }
  }

  // Check if too many attempts
  if (attempt.count >= BRUTE_FORCE_CONFIG.maxAttempts) {
    attempt.lockedUntil = now + BRUTE_FORCE_CONFIG.lockDurationMs
    return { allowed: false, retryAfterMs: BRUTE_FORCE_CONFIG.lockDurationMs }
  }

  return { allowed: true }
}

export function recordFailedLogin(ip: string): void {
  startBruteForceCleanup()
  const now = Date.now()
  const attempt = loginAttemptStore.get(ip)

  if (!attempt || now - attempt.firstAttempt > BRUTE_FORCE_CONFIG.windowMs) {
    loginAttemptStore.set(ip, { count: 1, firstAttempt: now, lockedUntil: null })
    return
  }

  attempt.count++

  if (attempt.count >= BRUTE_FORCE_CONFIG.maxAttempts) {
    attempt.lockedUntil = now + BRUTE_FORCE_CONFIG.lockDurationMs
  }
}

export function clearFailedLogins(ip: string): void {
  loginAttemptStore.delete(ip)
}

// ─── UUID Validation ─────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}

// ─── Safe Search Parameter ───────────────────────────────
// Escapes special characters in search strings to prevent SQL-like injection
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') return ''
  // Escape Supabase/PostgREST special chars: %, _, \
  return query
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .slice(0, INPUT_LIMITS.searchQuery)
}
