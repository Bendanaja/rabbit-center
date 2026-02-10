import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { generateImage } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/image/generate - Generate images using BytePlus Seedream
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { prompt, model, size, n } = body as {
      prompt: string
      model?: string
      size?: string
      n?: number
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const result = await generateImage({ prompt, model, size, n })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation failed'
    console.error('Image generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
