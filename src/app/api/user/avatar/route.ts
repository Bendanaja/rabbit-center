import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// POST /api/user/avatar - Upload avatar image
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { imageBase64, contentType } = body as {
      imageBase64?: string
      contentType?: string
    }

    if (!imageBase64) {
      return NextResponse.json({ error: 'กรุณาเลือกรูปภาพ' }, { status: 400 })
    }

    if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WebP' }, { status: 400 })
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'ไฟล์มีขนาดใหญ่เกิน 2MB' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const ext = (contentType || 'image/jpeg').split('/')[1] || 'jpeg'
    const filePath = `${user.id}/avatar.${ext}`

    // Try to upload to Supabase storage
    let avatarUrl: string | null = null

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
      })

    if (!uploadError) {
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      avatarUrl = urlData.publicUrl
    } else {
      // Storage bucket may not exist - try to create it and retry
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_TYPES,
        })

        const { error: retryError } = await supabase.storage
          .from('avatars')
          .upload(filePath, buffer, {
            contentType: contentType || 'image/jpeg',
            upsert: true,
          })

        if (!retryError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)
          avatarUrl = urlData.publicUrl
        }
      }

      // If storage still fails, store as data URL fallback
      if (!avatarUrl) {
        const mimeType = contentType || 'image/jpeg'
        avatarUrl = `data:${mimeType};base64,${base64Data}`
      }
    }

    // Update customer_profiles
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (updateError && updateError.code === 'PGRST116') {
      // No row to update - upsert instead
      await supabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          avatar_url: avatarUrl,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          signup_source: user.app_metadata?.provider || 'email',
        }, { onConflict: 'user_id' })
    } else if (updateError) {
      console.error('Failed to update avatar:', updateError)
      return NextResponse.json({ error: 'บันทึกรูปภาพล้มเหลว' }, { status: 500 })
    }

    // Also update Supabase auth user metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { avatar_url: avatarUrl },
    })

    return NextResponse.json({ avatar_url: avatarUrl })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }
}

// DELETE /api/user/avatar - Remove avatar
export async function DELETE(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Remove from storage (try common extensions)
  for (const ext of ['jpeg', 'png', 'gif', 'webp']) {
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.${ext}`])
  }

  // Clear avatar_url in customer_profiles
  await supabase
    .from('customer_profiles')
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  // Clear from auth metadata
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { avatar_url: null },
  })

  return NextResponse.json({ success: true })
}
