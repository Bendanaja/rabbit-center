import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { uploadImageToR2 } from '@/lib/cloudflare-r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff',
]

// POST /api/admin/models/upload-icon — Upload model icon to R2
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin
  const supabase = createAdminClient()
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { imageBase64, contentType, modelId } = body as {
      imageBase64: string
      contentType: string
      modelId: string
    }

    if (!imageBase64 || !modelId) {
      return NextResponse.json({ error: 'imageBase64 and modelId are required' }, { status: 400 })
    }

    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `รองรับเฉพาะไฟล์: ${ALLOWED_TYPES.map(t => t.split('/')[1]).join(', ')}` },
        { status: 400 }
      )
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ไฟล์มีขนาดใหญ่เกิน 5MB' }, { status: 400 })
    }

    const ext = contentType === 'image/svg+xml' ? 'svg' : (contentType.split('/')[1] || 'png')
    // Sanitize modelId for use as path (replace / with -)
    const safeModelId = modelId.replace(/\//g, '-')
    const key = `model-icons/${safeModelId}.${ext}`

    const iconUrl = await uploadImageToR2(imageBase64, key, contentType)

    // Update the model's icon_url in DB
    const { error: updateError } = await supabase
      .from('ai_models')
      .update({ icon_url: iconUrl, updated_at: new Date().toISOString() })
      .eq('id', modelId)

    if (updateError) {
      console.error('Failed to update model icon_url:', updateError)
    }

    return NextResponse.json({ icon_url: iconUrl })
  } catch (error) {
    console.error('Model icon upload error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'อัพโหลดไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 })
  }
}
