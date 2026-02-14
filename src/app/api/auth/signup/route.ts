import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

// POST /api/auth/signup - Create user without email confirmation
export async function POST(request: Request) {
  // Rate limiting for signup (prevent abuse)
  const rateLimitKey = getRateLimitKey(request, undefined, 'auth')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.auth)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  const adminSupabase = createAdminClient()

  try {
    const body = await request.json()
    const { email, password, full_name } = body

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password strength validation
    // At least 8 characters, with at least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' },
        { status: 400 }
      )
    }

    // Create user with admin client (bypasses email confirmation)
    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || email.split('@')[0],
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      user: data.user,
      message: 'Account created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
