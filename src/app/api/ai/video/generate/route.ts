import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generateVideo } from '@/lib/byteplus'
import { checkRateLimitRedis, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders, getUserRateLimitConfig } from '@/lib/rate-limit'
import { checkPlanLimit, incrementUsage, logUsageCost } from '@/lib/plan-limits'
import { calculateUsageCost, getVideoCost } from '@/lib/token-costs'
import { validateContentType, validateInput, INPUT_LIMITS, validateSafeUrl } from '@/lib/security'
import { trackActivity } from '@/lib/activity'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/video/generate - Start video generation using BytePlus Seedance
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting (Redis-backed, per-user config)
  const rateLimitKey = getRateLimitKey(request, user.id, 'video')
  const rateLimitConfig = await getUserRateLimitConfig(user.id, 'video')
  const rateLimitResult = await checkRateLimitRedis(rateLimitKey, rateLimitConfig)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating more videos.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  try {
    // Content-Type validation
    const ctError = validateContentType(request)
    if (ctError) {
      return NextResponse.json({ error: ctError }, { status: 415 })
    }

    const body = await request.json()
    const { prompt, model, duration, image_url } = body as {
      prompt: string
      model?: string
      duration?: number
      image_url?: string
    }

    // Plan limit check: video quota
    const videoModelKey = model || 'seedance-1-5-pro'
    const costThb = getVideoCost(videoModelKey).thb
    const planCheck = await checkPlanLimit(user.id, 'video', videoModelKey, costThb)
    if (!planCheck.allowed) {
      return NextResponse.json(
        { error: planCheck.reason, planId: planCheck.planId },
        { status: 403 }
      )
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
    if (duration !== undefined && (typeof duration !== 'number' || duration < 1 || duration > 30)) {
      return NextResponse.json({ error: 'duration must be between 1 and 30 seconds' }, { status: 400 })
    }

    // Validate image_url to prevent SSRF
    if (image_url) {
      const urlCheck = validateSafeUrl(image_url)
      if (!urlCheck.valid) {
        return NextResponse.json({ error: `Invalid image_url: ${urlCheck.reason}` }, { status: 400 })
      }
    }

    // Track activity in customer_profiles (non-blocking)
    trackActivity(user.id, 'video')

    // Route to the correct provider
    const { getModelById, getModelKey, MODELS } = await import('@/lib/byteplus')
    const modelDef = getModelById(model || '') || MODELS[model || ''] || MODELS[getModelKey(model || '') || '']

    // Determine provider: check MODELS first, then DB for dynamically-added models
    let isReplicate = modelDef?.apiProvider === 'replicate'
    let replicateModelId = modelDef?.id || ''

    if (!modelDef && model) {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const { data: dbModel } = await supabase
        .from('ai_models')
        .select('id, capabilities')
        .eq('id', model)
        .single()
      if (dbModel?.capabilities?.includes('__replicate')) {
        isReplicate = true
        replicateModelId = dbModel.id
      }
    }

    let result: { taskId: string }

    if (isReplicate) {
      const { generateVideoReplicate } = await import('@/lib/replicate')
      result = await generateVideoReplicate({ prompt, replicateModelId, duration, image_url })
    } else {
      result = await generateVideo({ prompt, model, duration, image_url })
    }

    // Increment usage AFTER successful generation
    await incrementUsage(user.id, 'video', costThb)

    // Internal cost tracking (non-blocking)
    const costUsd = calculateUsageCost({
      userId: user.id,
      modelKey: videoModelKey,
      action: 'video',
    })
    logUsageCost(user.id, 'video', videoModelKey, costUsd)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation failed'
    console.error('Video generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
