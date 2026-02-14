import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { streamChat, generateChatTitle, type ChatMessage } from '@/lib/byteplus'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/generate - Generate AI response with streaming
export async function POST(request: Request) {
  const adminSupabase = createAdminClient()

  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { chatId, messages, model } = body as {
    chatId: string
    messages: ChatMessage[]
    model: string
  }

  if (!chatId || !messages || !model) {
    return NextResponse.json(
      { error: 'chatId, messages, and model are required' },
      { status: 400 }
    )
  }

  // Verify user owns this chat using admin client to avoid type issues
  const { data: chat, error: chatError } = await adminSupabase
    .from('chats')
    .select('id, title, user_id')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  }

  const chatTitle = chat.title as string

  // Create a streaming response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamChat(
          messages,
          model,
          {
            onChunk: (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
            },
            onDone: async (response) => {
              // Save assistant message to database using admin client to bypass RLS
              const { data: savedMessage, error: saveError } = await adminSupabase
                .from('messages')
                .insert({
                  chat_id: chatId,
                  role: 'assistant' as const,
                  content: response,
                  model_id: model,
                })
                .select()
                .single()

              if (saveError) {
                console.error('Save message error:', saveError)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to save message' })}\n\n`))
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', messageId: savedMessage?.id })}\n\n`))
              }

              // Auto-generate title if this is the first message exchange
              // Combined with updated_at to avoid duplicate database calls
              const updateData: { updated_at: string; title?: string } = {
                updated_at: new Date().toISOString()
              }

              if (chatTitle === 'แชทใหม่' && messages.length <= 2) {
                const userMessage = messages.find(m => m.role === 'user')
                if (userMessage) {
                  const title = await generateChatTitle(userMessage.content)
                  updateData.title = title
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'title', title })}\n\n`))
                }
              }

              // Single database update for both title and updated_at
              await adminSupabase
                .from('chats')
                .update(updateData)
                .eq('id', chatId)

              controller.close()
            },
            onError: (error) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
              controller.close()
            },
          }
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
