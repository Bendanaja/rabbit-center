import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadImageToR2 } from '@/lib/cloudflare-r2'
import { validateContentType, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILES = 4

// POST /api/chat/upload - Upload image attachment to R2
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
  }

  const body = await request.json()
  const { images, chatId } = body as {
    images: { base64: string; contentType: string; fileName?: string }[]
    chatId: string
  }

  if (!chatId || !images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'chatId and images are required' }, { status: 400 })
  }

  // Verify user owns this chat
  const adminSupabase = createAdminClient()
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  if (images.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 })
  }

  const results: { url: string; contentType: string; fileName?: string }[] = []
  const timestamp = Date.now()

  for (let i = 0; i < images.length; i++) {
    const { base64, contentType, fileName } = images[i]

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: `Unsupported file type: ${contentType}. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 })
    }

    // Validate size (~10MB base64)
    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '')
    if (cleanBase64.length > INPUT_LIMITS.imageBase64) {
      return NextResponse.json({ error: 'Image exceeds 10MB size limit' }, { status: 400 })
    }

    const ext = contentType.split('/')[1] || 'jpg'
    const key = `attachments/${chatId}/${timestamp}-${i}.${ext}`

    try {
      const url = await uploadImageToR2(base64, key, contentType)
      results.push({ url, contentType, fileName })
    } catch (error) {
      console.error(`[Upload] Failed to upload image ${i}:`, error)
      return NextResponse.json({ error: 'Image upload service unavailable, please try again' }, { status: 503 })
    }
  }

  return NextResponse.json({ images: results })
}
