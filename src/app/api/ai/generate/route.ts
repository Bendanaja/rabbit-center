import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { streamChat, generateChatTitle, type ChatMessage } from '@/lib/byteplus'
import { checkRateLimitRedis, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { checkPlanLimit, incrementUsage, logUsageCost } from '@/lib/plan-limits'
import { calculateUsageCost } from '@/lib/token-costs'
import { validateContentType, validateInput, sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { trackActivity } from '@/lib/activity'
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

  // Rate limiting (Redis-backed)
  const rateLimitKey = getRateLimitKey(request, user.id, 'chat')
  const rateLimitResult = await checkRateLimitRedis(rateLimitKey, RATE_LIMITS.chat)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before sending more messages.' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  // Content-Type validation
  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
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

  // Type and length validation
  const chatIdErr = validateInput(chatId, { type: 'string', maxLength: INPUT_LIMITS.chatId, fieldName: 'chatId' })
  const modelErr = validateInput(model, { type: 'string', maxLength: INPUT_LIMITS.modelId, fieldName: 'model' })
  if (chatIdErr || modelErr) {
    return NextResponse.json({ error: chatIdErr || modelErr }, { status: 400 })
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 })
  }

  // Validate and sanitize each message
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return NextResponse.json({ error: 'Each message must have role and content' }, { status: 400 })
    }
    if (!['user', 'assistant', 'system'].includes(msg.role)) {
      return NextResponse.json({ error: 'Invalid message role' }, { status: 400 })
    }
    if (typeof msg.content !== 'string' || msg.content.length > INPUT_LIMITS.message) {
      return NextResponse.json({ error: `Message content exceeds maximum length of ${INPUT_LIMITS.message} characters` }, { status: 400 })
    }
    // Sanitize user messages before sending to AI
    if (msg.role === 'user') {
      msg.content = sanitizeInput(msg.content)
    }
  }

  // Plan limit check: message quota + model access
  const planCheck = await checkPlanLimit(user.id, 'chat', model)
  if (!planCheck.allowed) {
    return NextResponse.json(
      { error: planCheck.reason, planId: planCheck.planId, limit: planCheck.limit, used: planCheck.used },
      { status: 403 }
    )
  }

  // Track activity in customer_profiles (non-blocking)
  trackActivity(user.id, 'chat')

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
                // Increment usage AFTER successful stream completion and message save
                await incrementUsage(user.id, 'chat')
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

              // Internal cost tracking (non-blocking, never shown to users)
              const inputTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
              const outputTokens = Math.ceil(response.length / 4)
              const costUsd = calculateUsageCost({
                userId: user.id,
                modelKey: model,
                action: 'chat',
                inputTokens,
                outputTokens,
              })
              logUsageCost(user.id, 'chat', model, costUsd, inputTokens, outputTokens)

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
