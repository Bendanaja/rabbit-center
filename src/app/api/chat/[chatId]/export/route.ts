import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getModelById } from '@/lib/byteplus'

// GET /api/chat/[chatId]/export?format=markdown|json
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

  // Get chat with ownership check
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id, title, model_id, created_at, updated_at')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  // Get messages
  const { data: messages, error: msgError } = await adminSupabase
    .from('messages')
    .select('id, role, content, model_id, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  const url = new URL(request.url)
  const format = url.searchParams.get('format') || 'markdown'

  if (format === 'json') {
    const exportData = {
      title: chat.title,
      model: chat.model_id,
      created_at: chat.created_at,
      messages: (messages || []).map(m => ({
        role: m.role,
        content: m.content,
        model: m.model_id,
        timestamp: m.created_at,
      })),
    }

    const filename = `${chat.title.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').trim() || 'chat'}.json`

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  }

  // Markdown format
  const modelInfo = getModelById(chat.model_id)
  const modelName = modelInfo?.name || chat.model_id

  let markdown = `# Chat: ${chat.title}\n`
  markdown += `Date: ${new Date(chat.created_at).toLocaleString('th-TH')}\n`
  markdown += `Model: ${modelName}\n\n---\n\n`

  for (const msg of messages || []) {
    if (msg.role === 'user') {
      markdown += `**You:** ${msg.content}\n\n`
    } else if (msg.role === 'assistant') {
      const msgModel = msg.model_id ? (getModelById(msg.model_id)?.name || msg.model_id) : modelName
      markdown += `**AI (${msgModel}):** ${msg.content}\n\n`
    }
    markdown += `---\n\n`
  }

  const filename = `${chat.title.replace(/[^a-zA-Z0-9ก-๙\s]/g, '').trim() || 'chat'}.md`

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}
