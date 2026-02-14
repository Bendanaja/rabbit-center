import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/shared/[shareId] - Get shared chat (public, no auth)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  const adminSupabase = createAdminClient()

  // Find chat by share token
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id, title, model_id, created_at, is_shared')
    .eq('share_token', shareId)
    .eq('is_shared', true)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Shared chat not found' }, { status: 404 })
  }

  // Get messages
  const { data: messages, error: msgError } = await adminSupabase
    .from('messages')
    .select('role, content, model_id, created_at')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true })

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({
    title: chat.title,
    model_id: chat.model_id,
    created_at: chat.created_at,
    messages: messages || [],
  })
}
