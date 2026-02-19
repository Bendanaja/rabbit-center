import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { validateContentType, validateInput, sanitizeInput, INPUT_LIMITS, checkBruteForce, recordFailedLogin, getClientIP } from '@/lib/security'
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
    const { email, password, full_name, phone_number } = body

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Type and length validation
    const emailErr = validateInput(email, { type: 'string', maxLength: INPUT_LIMITS.email, fieldName: 'email' })
    const pwErr = validateInput(password, { type: 'string', maxLength: INPUT_LIMITS.password, fieldName: 'password' })
    if (emailErr || pwErr) {
      return NextResponse.json({ error: emailErr || pwErr }, { status: 400 })
    }
    if (full_name) {
      const nameErr = validateInput(full_name, { type: 'string', maxLength: INPUT_LIMITS.fullName, fieldName: 'full_name' })
      if (nameErr) return NextResponse.json({ error: nameErr }, { status: 400 })
    }
    {
      const phoneErr = validateInput(phone_number, { type: 'string', maxLength: 20, fieldName: 'phone_number' })
      if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })
      // Validate Thai phone format
      const cleaned = phone_number.replace(/[-\s]/g, '')
      const thaiPhoneRegex = /^0[0-9]{8,9}$/
      if (!thaiPhoneRegex.test(cleaned)) {
        return NextResponse.json({ error: 'Invalid Thai phone number format' }, { status: 400 })
      }
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
        full_name: sanitizeInput(full_name || email.split('@')[0]),
      },
    })

    if (error) {
      console.error('Signup error:', error)
      recordFailedLogin(ip)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Create customer profile for Big Data collection
    if (data.user) {
      const userAgent = request.headers.get('user-agent') || ''
      const deviceInfo = parseDeviceInfo(userAgent)

      await adminSupabase
        .from('customer_profiles')
        .insert({
          user_id: data.user.id,
          display_name: sanitizeInput(full_name || email.split('@')[0]),
          phone_number: phone_number || null,
          signup_source: 'email',
          device_info: deviceInfo,
        })
        .then(({ error: profileError }) => {
          if (profileError) {
            // Non-blocking: log but don't fail signup
            console.error('Customer profile creation error:', profileError)
          }
        })
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

function parseDeviceInfo(userAgent: string): Record<string, string> {
  const info: Record<string, string> = { raw: userAgent.slice(0, 500) }

  // Detect browser
  if (userAgent.includes('Firefox/')) info.browser = 'Firefox'
  else if (userAgent.includes('Edg/')) info.browser = 'Edge'
  else if (userAgent.includes('Chrome/')) info.browser = 'Chrome'
  else if (userAgent.includes('Safari/')) info.browser = 'Safari'
  else info.browser = 'Other'

  // Detect OS
  if (userAgent.includes('Windows')) info.os = 'Windows'
  else if (userAgent.includes('Mac OS')) info.os = 'macOS'
  else if (userAgent.includes('Linux')) info.os = 'Linux'
  else if (userAgent.includes('Android')) info.os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) info.os = 'iOS'
  else info.os = 'Other'

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) info.device_type = 'mobile'
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) info.device_type = 'tablet'
  else info.device_type = 'desktop'

  return info
}
