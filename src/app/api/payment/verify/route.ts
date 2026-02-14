import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { verifySlip, verifySlipByImage } from '@/lib/thunder'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/payment/verify - Verify payment slip
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
  const { payload, imageBase64, checkDuplicate } = body as {
    payload?: string
    imageBase64?: string
    checkDuplicate?: boolean
  }

  if (!payload && !imageBase64) {
    return NextResponse.json(
      { error: 'Either payload or imageBase64 is required' },
      { status: 400 }
    )
  }

  try {
    const result = payload
      ? await verifySlip(payload, checkDuplicate)
      : await verifySlipByImage(imageBase64!)

    const res = NextResponse.json(result)
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Slip verification failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
