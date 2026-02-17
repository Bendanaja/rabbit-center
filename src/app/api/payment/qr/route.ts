import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generatePromptPayQR } from '@/lib/thunder'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/payment/qr - Generate PromptPay QR code (server-side PromptPay ID)
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

  const promptPayId = process.env.PROMPTPAY_ID
  if (!promptPayId) {
    return NextResponse.json({ error: 'PromptPay not configured' }, { status: 503 })
  }

  const body = await request.json()
  const { amount } = body as { amount?: number }

  if (!amount || !Number.isFinite(amount) || amount <= 0 || amount > 50000) {
    return NextResponse.json({ error: 'amount is required, must be positive, and cannot exceed 50,000 THB' }, { status: 400 })
  }

  // Auto-detect: phone (10 digits, starts with 0) or tax ID (13 digits)
  const isPhone = /^0\d{9}$/.test(promptPayId)
  const isTaxId = /^\d{13}$/.test(promptPayId)

  if (!isPhone && !isTaxId) {
    return NextResponse.json({ error: 'Invalid PromptPay ID configuration' }, { status: 500 })
  }

  try {
    const result = await generatePromptPayQR({
      type: 'PROMPTPAY',
      ...(isPhone ? { msisdn: promptPayId } : { natId: promptPayId }),
      amount,
    })
    const res = NextResponse.json(result)
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  } catch (error) {
    const message = error instanceof Error ? error.message : 'QR generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
