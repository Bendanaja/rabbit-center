import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

// GET /api/chat/[chatId]/messages - Get all messages for a chat
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
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

  const { data, error } = await adminSupabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/chat/[chatId]/messages - Create a new message
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

  // Verify user owns this chat
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id, model_id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const body = await request.json()
  const { role, content, model_id, tokens_used } = body

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content are required' }, { status: 400 })
  }

  // Validate types
  if (typeof role !== 'string' || !['user', 'assistant', 'system'].includes(role)) {
    return NextResponse.json({ error: 'role must be user, assistant, or system' }, { status: 400 })
  }
  if (typeof content !== 'string' || content.length > INPUT_LIMITS.message) {
    return NextResponse.json({ error: `content exceeds maximum length of ${INPUT_LIMITS.message} characters` }, { status: 400 })
  }
  if (tokens_used !== undefined && typeof tokens_used !== 'number') {
    return NextResponse.json({ error: 'tokens_used must be a number' }, { status: 400 })
  }

  // Sanitize user messages before storing
  const safeContent = role === 'user' ? sanitizeInput(content) : content

  const { data, error } = await adminSupabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role,
      content: safeContent,
      model_id: model_id ? String(model_id).slice(0, INPUT_LIMITS.modelId) : chat.model_id,
      tokens_used,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update chat's updated_at
  await adminSupabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId)

  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/chat/[chatId]/messages - Update a message's content
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params
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
  const { messageId, content } = body

  if (!messageId || !content) {
    return NextResponse.json({ error: 'messageId and content are required' }, { status: 400 })
  }

  if (typeof content !== 'string' || content.length > INPUT_LIMITS.message) {
    return NextResponse.json({ error: `content exceeds maximum length of ${INPUT_LIMITS.message} characters` }, { status: 400 })
  }

  const safeContent = sanitizeInput(content)

  // Only allow editing user messages (not assistant/system)
  const { data, error } = await adminSupabase
    .from('messages')
    .update({ content: safeContent })
    .eq('id', messageId)
    .eq('chat_id', chatId)
    .eq('role', 'user')
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

// DELETE /api/chat/[chatId]/messages - Delete all messages for a chat
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

  const { error } = await adminSupabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
