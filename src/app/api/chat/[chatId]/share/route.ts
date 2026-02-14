import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// POST /api/chat/[chatId]/share - Generate share link
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id, share_token, is_shared')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  // If already shared, return existing token
  if (chat.is_shared && chat.share_token) {
    return NextResponse.json({
      share_token: chat.share_token,
      share_url: `/shared/${chat.share_token}`,
    })
  }

  // Generate new share token
  const shareToken = crypto.randomBytes(8).toString('hex') // 16 char hex

  const { error: updateError } = await adminSupabase
    .from('chats')
    .update({
      share_token: shareToken,
      is_shared: true,
    })
    .eq('id', chatId)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    share_token: shareToken,
    share_url: `/shared/${shareToken}`,
  })
}

// DELETE /api/chat/[chatId]/share - Remove share link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error: updateError } = await adminSupabase
    .from('chats')
    .update({
      share_token: null,
      is_shared: false,
    })
    .eq('id', chatId)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
