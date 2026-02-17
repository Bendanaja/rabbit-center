import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

// GET /api/chat - List all chats for the current user
export async function GET(request: Request) {
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await adminSupabase
    .from('chats')
    .select('id, title, model_id, created_at, updated_at, is_archived')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/chat - Create a new chat
export async function POST(request: Request) {
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, model_id } = body

  // Validate and sanitize inputs
  const safeTitle = title
    ? sanitizeInput(String(title)).slice(0, INPUT_LIMITS.title)
    : 'แชทใหม่'
  const safeModelId = model_id
    ? String(model_id).slice(0, INPUT_LIMITS.modelId)
    : 'stepfun/step-3.5-flash:free'

  const { data, error } = await adminSupabase
    .from('chats')
    .insert({
      user_id: user.id,
      title: safeTitle,
      model_id: safeModelId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
