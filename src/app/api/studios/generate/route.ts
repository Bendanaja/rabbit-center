import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { flowGenerate, type FlowMode } from '@/lib/flow-api'
import { uploadImageToR2 } from '@/lib/cloudflare-r2'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_MODES: FlowMode[] = ['image', 'video', 'frame_to_video', 'video_mix']

export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { prompt, mode, model, aspect_ratio, image_url, end_image_url } = body as {
      prompt: string
      mode: FlowMode
      model?: string
      aspect_ratio?: string
      image_url?: string
      end_image_url?: string
    }

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    if (!mode || !VALID_MODES.includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: 'Prompt too long (max 2000 chars)' }, { status: 400 })
    }

    // Upload base64 images to R2 if needed (Flow API needs public URLs)
    let resolvedImageUrl = image_url
    let resolvedEndImageUrl = end_image_url

    if (image_url && image_url.startsWith('data:')) {
      const key = `studios/${user.id}/${Date.now()}-input.jpg`
      resolvedImageUrl = await uploadImageToR2(image_url, key)
    }

    if (end_image_url && end_image_url.startsWith('data:')) {
      const key = `studios/${user.id}/${Date.now()}-end.jpg`
      resolvedEndImageUrl = await uploadImageToR2(end_image_url, key)
    }

    const result = await flowGenerate({
      prompt: prompt.trim(),
      mode,
      model,
      aspect_ratio,
      image_url: resolvedImageUrl,
      end_image_url: resolvedEndImageUrl,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    console.error('Studios generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
