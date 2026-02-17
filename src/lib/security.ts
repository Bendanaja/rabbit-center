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
    .replace(/<\/?(script|iframe|object|embed|form|input|textarea|button|select|option|link|style|meta|base|applet|svg|img|details|math|video|audio|source|picture|marquee|blink|frameset|frame|layer|ilayer|bgsound|title|isindex|listing|xmp|plaintext|comment)[^>]*>/gi, '')
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
// TODO: Move brute force store to Redis for multi-instance deployments
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
  return forwarded?.split(',').pop()?.trim() || 'unknown'
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

// ─── SSRF Protection: URL Validation ─────────────────────
// Validates that a URL is safe to fetch server-side (prevents SSRF attacks)

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'internal',
  'metadata',
  'metadata.google.internal',
  'metadata.internal',
])

// Check if four IPv4 octets fall in a private/reserved range
function isPrivateIPv4(a: number, b: number, c: number, d: number): boolean {
  // 0.0.0.0
  if (a === 0 && b === 0 && c === 0 && d === 0) return true
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true
  // 10.0.0.0/8 (private)
  if (a === 10) return true
  // 172.16.0.0/12 (private)
  if (a === 172 && b >= 16 && b <= 31) return true
  // 192.168.0.0/16 (private)
  if (a === 192 && b === 168) return true
  // 169.254.0.0/16 (link-local / cloud metadata)
  if (a === 169 && b === 254) return true
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

function isPrivateIP(hostname: string): boolean {
  // IPv6 loopback
  if (hostname === '::1' || hostname === '[::1]') return true

  // Check for IPv6-mapped IPv4 addresses (e.g., ::ffff:127.0.0.1)
  if (hostname.toLowerCase().startsWith('::ffff:')) {
    const ipv4Part = hostname.slice(7)
    return isPrivateIP(ipv4Part)
  }
  // Bracket notation [::ffff:127.0.0.1]
  if (hostname.startsWith('[') && hostname.toLowerCase().includes('::ffff:')) {
    const inner = hostname.slice(1, -1)
    const ipv4Part = inner.replace(/^::ffff:/i, '')
    return isPrivateIP(ipv4Part)
  }

  // Remove brackets for IPv6
  const clean = hostname.replace(/^\[|\]$/g, '')

  // Block IPv6 ULA (fc00::/7 = fc00:: to fdff::)
  if (/^f[cd]/i.test(clean)) return true

  // Block IPv6 link-local (fe80::/10)
  if (/^fe[89ab]/i.test(clean)) return true

  // IPv4 dotted-quad patterns
  const parts = clean.split('.')
  if (parts.length === 4) {
    const numParts = parts.map(Number)
    if (numParts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
      // Reject octal notation (leading zeros, e.g., 0177.0.0.1)
      if (parts.some(p => p.length > 1 && p.startsWith('0'))) {
        return true // treat as private/suspicious
      }
      return isPrivateIPv4(numParts[0], numParts[1], numParts[2], numParts[3])
    }
  }

  // Check for decimal IP notation (e.g., 2130706433 = 127.0.0.1)
  const numericHost = Number(clean)
  if (Number.isFinite(numericHost) && numericHost > 0) {
    const a = (numericHost >>> 24) & 0xFF
    const b = (numericHost >>> 16) & 0xFF
    const c = (numericHost >>> 8) & 0xFF
    const d = numericHost & 0xFF
    return isPrivateIPv4(a, b, c, d)
  }

  return false
}

export function validateSafeUrl(url: string): { valid: true } | { valid: false; reason: string } {
  // Only allow https://
  if (!url.startsWith('https://')) {
    return { valid: false, reason: 'Only HTTPS URLs are allowed' }
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { valid: false, reason: 'Invalid URL format' }
  }

  // Enforce https after parsing (in case of protocol confusion)
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTPS URLs are allowed' }
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block known internal hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: 'Internal hostnames are not allowed' }
  }

  // Block private/reserved IP ranges
  if (isPrivateIP(hostname)) {
    return { valid: false, reason: 'Private or reserved IP addresses are not allowed' }
  }

  // Block DNS rebinding service domains
  const BLOCKED_REBINDING_DOMAINS = ['nip.io', 'sslip.io', 'xip.io', 'localtest.me', 'lvh.me', 'vcap.me']
  if (BLOCKED_REBINDING_DOMAINS.some(d => hostname.endsWith('.' + d) || hostname === d)) {
    return { valid: false, reason: 'DNS rebinding domain not allowed' }
  }

  return { valid: true }
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
