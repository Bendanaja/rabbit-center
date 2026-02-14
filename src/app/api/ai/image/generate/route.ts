import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generateImage } from '@/lib/byteplus'
import { checkRateLimitRedis, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { checkPlanLimit, incrementUsage, logUsageCost } from '@/lib/plan-limits'
import { calculateUsageCost } from '@/lib/token-costs'
import { validateContentType, validateInput, sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { trackActivity } from '@/lib/activity'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/image/generate - Generate images using BytePlus Seedream
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting (Redis-backed)
  const rateLimitKey = getRateLimitKey(request, user.id, 'image')
  const rateLimitResult = await checkRateLimitRedis(rateLimitKey, RATE_LIMITS.image)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating more images.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  try {
    // Plan limit check: image quota
    const planCheck = await checkPlanLimit(user.id, 'image')
    if (!planCheck.allowed) {
      return NextResponse.json(
        { error: planCheck.reason, planId: planCheck.planId, limit: planCheck.limit, used: planCheck.used },
        { status: 403 }
      )
    }

    // Content-Type validation
    const ctError = validateContentType(request)
    if (ctError) {
      return NextResponse.json({ error: ctError }, { status: 415 })
    }

    const body = await request.json()
    const { prompt, model, size, n, image } = body as {
      prompt: string
      model?: string
      size?: string
      n?: number
      image?: string // Reference image URL or base64 for i2i
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    // Input validation
    const promptErr = validateInput(prompt, { type: 'string', maxLength: INPUT_LIMITS.prompt, fieldName: 'prompt' })
    if (promptErr) {
      return NextResponse.json({ error: promptErr }, { status: 400 })
    }
    if (model) {
      const modelErr = validateInput(model, { type: 'string', maxLength: INPUT_LIMITS.modelId, fieldName: 'model' })
      if (modelErr) return NextResponse.json({ error: modelErr }, { status: 400 })
    }
    if (n !== undefined && (typeof n !== 'number' || n < 1 || n > 4)) {
      return NextResponse.json({ error: 'n must be a number between 1 and 4' }, { status: 400 })
    }
    if (image) {
      const imgErr = validateInput(image, { type: 'string', maxLength: INPUT_LIMITS.imageBase64, fieldName: 'image' })
      if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 })
    }

    // Track activity in customer_profiles (non-blocking)
    trackActivity(user.id, 'image')

    const result = await generateImage({ prompt, model, size, n, image })

    // Increment usage AFTER successful generation
    await incrementUsage(user.id, 'image')

    // Internal cost tracking (non-blocking)
    const imageModelKey = model || 'seedream-4-5'
    const costUsd = calculateUsageCost({
      userId: user.id,
      modelKey: imageModelKey,
      action: 'image',
    })
    logUsageCost(user.id, 'image', imageModelKey, costUsd)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed'
    console.error('Image generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
