import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { validateContentType, validateInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const rateLimitKey = getRateLimitKey(request, undefined, 'auth')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.auth)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailErr = validateInput(email, { type: 'string', maxLength: INPUT_LIMITS.email, fieldName: 'email' })
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const { error } = await adminSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/update-password`,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password reset email sent' })
  } catch {
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 })
  }
}
