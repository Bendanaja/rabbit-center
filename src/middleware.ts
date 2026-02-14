import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/chat', '/admin', '/settings']
// Routes that are public
const PUBLIC_ROUTES = ['/', '/auth', '/pricing', '/about', '/contact', '/terms', '/privacy', '/features', '/free-access', '/payment', '/shared']
// Pages removed from public access - redirect to home
const REMOVED_PAGES = ['/blog', '/careers', '/updates', '/api-docs']
// API routes that are public (no auth required)
const PUBLIC_API_ROUTES = ['/api/auth', '/api/shared']

// ─── Global IP Rate Limit (in-memory, per-edge-instance) ──
const globalRateLimitStore = new Map<string, { count: number; resetAt: number }>()
const GLOBAL_RATE_LIMIT = { maxRequests: 100, windowMs: 60 * 1000 } // 100 req/min per IP

let globalCleanupStarted = false
function startGlobalCleanup() {
  if (globalCleanupStarted) return
  globalCleanupStarted = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of globalRateLimitStore) {
      if (now > entry.resetAt) globalRateLimitStore.delete(key)
    }
  }, 60 * 1000)
}

function checkGlobalRateLimit(ip: string): boolean {
  startGlobalCleanup()
  const now = Date.now()
  const entry = globalRateLimitStore.get(ip)

  if (!entry || now > entry.resetAt) {
    globalRateLimitStore.set(ip, { count: 1, resetAt: now + GLOBAL_RATE_LIMIT.windowMs })
    return true
  }

  entry.count++
  return entry.count <= GLOBAL_RATE_LIMIT.maxRequests
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // HSTS with subdomains and preload
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  // Permissions policy - deny unnecessary APIs
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()')
  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://*.rabbithub.ai https://*.supabase.co https://*.supabase.in https://ark.ap-southeast.bytepluses.com wss://*.supabase.co wss://*.rabbithub.ai",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '))

  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Skip static files, _next, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Redirect removed pages to home
  if (REMOVED_PAGES.some(page => pathname === page || pathname.startsWith(page + '/'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Global IP rate limit
  const clientIP = getClientIP(request)
  if (!checkGlobalRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // API routes
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    // Prevent caching of API responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    return response
  }

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (isProtected) {
    const response = NextResponse.next()
    response.headers.set('X-Protected-Route', 'true')
    return addSecurityHeaders(response)
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
