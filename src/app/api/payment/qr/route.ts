import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generatePromptPayQR, type QRCodeParams } from '@/lib/thunder'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/payment/qr - Generate PromptPay QR code
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, user.id, 'payment')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.payment)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before making more requests.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  const body = await request.json()
  const { type, msisdn, natId, amount } = body as QRCodeParams

  if (type !== 'PROMPTPAY') {
    return NextResponse.json({ error: 'type must be PROMPTPAY' }, { status: 400 })
  }

  if (!msisdn && !natId) {
    return NextResponse.json({ error: 'Either msisdn or natId is required' }, { status: 400 })
  }

  try {
    const result = await generatePromptPayQR({ type, msisdn, natId, amount })
    const res = NextResponse.json(result)
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  } catch (error) {
    const message = error instanceof Error ? error.message : 'QR generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
