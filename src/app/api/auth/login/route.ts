import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { validateContentType, validateInput, INPUT_LIMITS, checkBruteForce, recordFailedLogin, getClientIP } from '@/lib/security'
import { NextResponse } from 'next/server'

// POST /api/auth/login - Sign in with email and password
export async function POST(request: Request) {
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, undefined, 'auth')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.auth)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  // Brute force protection
  const ip = getClientIP(request)
  const bruteForceCheck = checkBruteForce(ip)
  if (!bruteForceCheck.allowed) {
    const retryAfterSec = Math.ceil((bruteForceCheck.retryAfterMs || 0) / 1000)
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': retryAfterSec.toString() } }
    )
  }

  // Content-Type validation
  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
  }

  const adminSupabase = createAdminClient()

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Type and length validation
    const emailErr = validateInput(email, { type: 'string', maxLength: INPUT_LIMITS.email, fieldName: 'email' })
    const pwErr = validateInput(password, { type: 'string', maxLength: INPUT_LIMITS.password, fieldName: 'password' })
    if (emailErr || pwErr) {
      return NextResponse.json({ error: emailErr || pwErr }, { status: 400 })
    }

    // Use signInWithPassword via admin client (server-side)
    const { data, error } = await adminSupabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      recordFailedLogin(ip)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Login error:', errMsg, error)
    return NextResponse.json(
      { error: `Failed to sign in: ${errMsg}` },
      { status: 500 }
    )
  }
}
