import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

// PATCH /api/chat/[chatId]/messages/[messageId] - Update a message's content and/or metadata
// Used by video generation to update placeholder messages with completed video or failure status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string; messageId: string }> }
) {
  const { chatId, messageId } = await params
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns this chat
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const body = await request.json()
  const { content, metadata } = body

  if (content === undefined && metadata === undefined) {
    return NextResponse.json({ error: 'content or metadata is required' }, { status: 400 })
  }

  if (content !== undefined && (typeof content !== 'string' || content.length > INPUT_LIMITS.message)) {
    return NextResponse.json({ error: `content exceeds maximum length of ${INPUT_LIMITS.message} characters` }, { status: 400 })
  }

  if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))) {
    return NextResponse.json({ error: 'metadata must be an object' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (content !== undefined) updateData.content = content
  if (metadata !== undefined) updateData.metadata = metadata

  const { data, error } = await adminSupabase
    .from('messages')
    .update(updateData)
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
