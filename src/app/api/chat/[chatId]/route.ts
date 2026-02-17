import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

// GET /api/chat/[chatId] - Get a specific chat
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

  const { data, error } = await adminSupabase
    .from('chats')
    .select('id, title, model_id, is_pinned, is_archived, created_at, updated_at')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/chat/[chatId] - Update a chat
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

  const body = await request.json()
  const { title, model_id, is_pinned, is_archived } = body

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (title !== undefined) {
    if (typeof title !== 'string') {
      return NextResponse.json({ error: 'title must be a string' }, { status: 400 })
    }
    updates.title = sanitizeInput(title).slice(0, INPUT_LIMITS.title)
  }
  if (model_id !== undefined) {
    if (typeof model_id !== 'string') {
      return NextResponse.json({ error: 'model_id must be a string' }, { status: 400 })
    }
    updates.model_id = String(model_id).slice(0, INPUT_LIMITS.modelId)
  }
  if (is_pinned !== undefined) {
    if (typeof is_pinned !== 'boolean') {
      return NextResponse.json({ error: 'is_pinned must be a boolean' }, { status: 400 })
    }
    updates.is_pinned = is_pinned
  }
  if (is_archived !== undefined) {
    if (typeof is_archived !== 'boolean') {
      return NextResponse.json({ error: 'is_archived must be a boolean' }, { status: 400 })
    }
    updates.is_archived = is_archived
  }

  const { data, error } = await adminSupabase
    .from('chats')
    .update(updates)
    .eq('id', chatId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/chat/[chatId] - Delete a chat
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

  const { error } = await adminSupabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
