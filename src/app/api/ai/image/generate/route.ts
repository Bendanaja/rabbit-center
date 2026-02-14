import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generateImage } from '@/lib/byteplus'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/image/generate - Generate images using BytePlus Seedream
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, user.id, 'image')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.image)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before generating more images.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  try {
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

    const result = await generateImage({ prompt, model, size, n, image })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed'
    console.error('Image generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
