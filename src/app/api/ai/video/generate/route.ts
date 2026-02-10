import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generateVideo } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/video/generate - Start video generation using BytePlus Seedance
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { prompt, model, duration, image_url } = body as {
      prompt: string
      model?: string
      duration?: number
      image_url?: string
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const result = await generateVideo({ prompt, model, duration, image_url })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Video generation failed'
    console.error('Video generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
