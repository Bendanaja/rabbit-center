import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { streamChat, chatCompletion, generateChatTitle, COMPACT_MODEL, getModelById, getModelKey, MODELS, type ChatMessage } from '@/lib/byteplus'
import { chatCompletionOpenRouterMultipart } from '@/lib/openrouter'
import { checkRateLimitRedis, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders, getUserRateLimitConfig } from '@/lib/rate-limit'
import { checkPlanLimit, incrementUsage, logUsageCost } from '@/lib/plan-limits'
import { searchWeb, shouldAutoSearch, formatSearchContext, formatSourcesMarker, type SearchResult } from '@/lib/web-search'
import { calculateUsageCost, estimateChatCost } from '@/lib/token-costs'
import { validateContentType, validateInput, sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { trackActivity } from '@/lib/activity'
import { uploadGeneratedImages } from '@/lib/cloudflare-r2'
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

  // Rate limiting (Redis-backed, per-user config)
  const rateLimitKey = getRateLimitKey(request, user.id, 'chat')
  const rateLimitConfig = await getUserRateLimitConfig(user.id, 'chat')
  const rateLimitResult = await checkRateLimitRedis(rateLimitKey, rateLimitConfig)
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
  const { chatId, messages, model, webSearch } = body as {
    chatId: string
    messages: ChatMessage[]
    model: string
    webSearch?: boolean
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

  // Filter out messages with empty content (e.g. old image-only responses)
  const validMessages = messages.filter(msg => msg.role && msg.content)

  // Validate and sanitize each message
  for (const msg of validMessages) {
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
  const estimatedCost = estimateChatCost(model).thb
  const planCheck = await checkPlanLimit(user.id, 'chat', model, estimatedCost)
  if (!planCheck.allowed) {
    return NextResponse.json(
      { error: planCheck.reason, planId: planCheck.planId },
      { status: 403 }
    )
  }

  // Track activity in customer_profiles (non-blocking)
  trackActivity(user.id, 'chat')

  // Detect if web search is needed: manual toggle or AI-based auto-detect
  const lastUserMsg = [...validMessages].reverse().find(m => m.role === 'user')
  let needsSearch = webSearch
  if (!webSearch && lastUserMsg) {
    console.log(`[Generate] Auto-search check for: "${lastUserMsg.content}", COMPACT_MODEL: ${COMPACT_MODEL}`)
    needsSearch = await shouldAutoSearch(lastUserMsg.content, chatCompletion, COMPACT_MODEL)
    console.log(`[Generate] Auto-search result: ${needsSearch}`)
  }
  const wasAutoSearched = !webSearch && needsSearch

  // Pre-validate search limits (before stream starts)
  if (needsSearch) {
    const searchPlanCheck = await checkPlanLimit(user.id, 'search')
    if (!searchPlanCheck.allowed) {
      if (webSearch) {
        return NextResponse.json(
          { error: searchPlanCheck.reason, planId: searchPlanCheck.planId },
          { status: 403 }
        )
      }
      needsSearch = false // silently skip auto-search if plan doesn't allow
    }
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
      let searchResults: SearchResult[] = []

      try {
        // Perform web search inside the stream so we can emit SSE events
        if (needsSearch && lastUserMsg) {
          // Emit searching indicator
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'searching', auto: wasAutoSearched })}\n\n`))

          // Rate limit for search
          const searchRateLimitKey = getRateLimitKey(request, user.id, 'search')
          const searchRateLimitConfig = await getUserRateLimitConfig(user.id, 'search')
          const searchRateLimit = await checkRateLimitRedis(searchRateLimitKey, searchRateLimitConfig)

          if (searchRateLimit.allowed) {
            const searchResponse = await searchWeb(lastUserMsg.content)
            searchResults = searchResponse.results

            if (searchResults.length > 0) {
              await incrementUsage(user.id, 'search')
            }
          }

          // Emit search results
          if (searchResults.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'search_results', searchResults, autoSearched: wasAutoSearched })}\n\n`))
          }
        }

        // Inject search context as system message if we have results
        const messagesWithSearch = [...validMessages]
        if (searchResults.length > 0) {
          const searchContext = formatSearchContext(searchResults)
          messagesWithSearch.unshift({
            role: 'system',
            content: searchContext,
          })
        }

        // Check if model supports image generation in chat (e.g. Nano Banana)
        // Look up capabilities from DB first, fallback to hardcoded registry
        // Look up capabilities: try DB key first, then full API ID
        const modelKey = getModelKey(model) || model
        const { data: modelRow } = await adminSupabase
          .from('ai_models')
          .select('capabilities')
          .eq('id', modelKey)
          .single()
        const modelDef = getModelById(model) || MODELS[modelKey]
        const capabilities: string[] = modelRow?.capabilities || modelDef?.capabilities || []
        const apiProvider = modelDef?.apiProvider || (model.includes('/') ? 'openrouter' : 'byteplus')
        const isImageGenChat = capabilities.includes('chat-image-gen') && apiProvider === 'openrouter'

        console.log(`[Generate] model=${model}, key=${modelKey}, dbCaps=${JSON.stringify(modelRow?.capabilities)}, defCaps=${JSON.stringify(modelDef?.capabilities)}, isImageGenChat=${isImageGenChat}`)

        if (isImageGenChat) {
          // Use non-streaming for image generation models (images can't be streamed)
          // Send heartbeat SSE every 15s to prevent Cloudflare 524 timeout
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`))
          }, 15_000)

          let text = '', imageUrls: string[] = [], tokensUsed: number | undefined
          let finalImageUrls: string[] = []
          try {
            const openrouterModelId = modelDef?.id || model
            const result = await chatCompletionOpenRouterMultipart(messagesWithSearch, openrouterModelId)
            text = result.text
            imageUrls = result.imageUrls
            tokensUsed = result.tokensUsed

            // Upload images to Cloudflare R2 (falls back to base64 if not configured)
            finalImageUrls = imageUrls.length > 0
              ? await uploadGeneratedImages(imageUrls, chatId)
              : []
          } finally {
            clearInterval(heartbeat)
          }

          // Build full response with image markers
          let fullResponse = text
          if (finalImageUrls.length > 0) {
            fullResponse += `\n\n[GENERATED_IMAGE]\n${finalImageUrls.join('\n')}\n[/GENERATED_IMAGE]`
          }

          // Emit text part as chunk for typewriter effect
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`))
          }

          // Save to database
          const { data: savedMessage, error: saveError } = await adminSupabase
            .from('messages')
            .insert({
              chat_id: chatId,
              role: 'assistant' as const,
              content: fullResponse,
              model_id: model,
            })
            .select()
            .single()

          // Usage tracking
          const inputTokens = validMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
          const outputTokens = tokensUsed || Math.ceil(fullResponse.length / 4)
          const costThb = estimateChatCost(model, inputTokens, outputTokens).thb
          await incrementUsage(user.id, 'chat', costThb)

          if (saveError) {
            console.error('Save message error:', saveError)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to save message' })}\n\n`))
          } else {
            // Include fullResponse in done event so frontend gets image markers
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', messageId: savedMessage?.id, content: fullResponse })}\n\n`))
          }

          // Auto-generate title
          const updateData: { updated_at: string; title?: string } = {
            updated_at: new Date().toISOString()
          }
          if (chatTitle === 'แชทใหม่' && messages.length <= 2) {
            const userMessage = validMessages.find(m => m.role === 'user')
            if (userMessage) {
              const title = await generateChatTitle(userMessage.content)
              updateData.title = title
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'title', title })}\n\n`))
            }
          }
          await adminSupabase.from('chats').update(updateData).eq('id', chatId)

          const costUsd = calculateUsageCost({ userId: user.id, modelKey: model, action: 'chat', inputTokens, outputTokens })
          logUsageCost(user.id, 'chat', model, costUsd, inputTokens, outputTokens)

          controller.close()
          return
        }

        await streamChat(
          messagesWithSearch,
          model,
          {
            onChunk: (chunk) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
            },
            onDone: async (response) => {
              // Append web sources marker if search was used
              const contentToSave = searchResults.length > 0
                ? response + formatSourcesMarker(searchResults)
                : response

              // Save assistant message to database using admin client to bypass RLS
              const { data: savedMessage, error: saveError } = await adminSupabase
                .from('messages')
                .insert({
                  chat_id: chatId,
                  role: 'assistant' as const,
                  content: contentToSave,
                  model_id: model,
                })
                .select()
                .single()

              // Calculate tokens and cost for usage tracking
              const inputTokens = validMessages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
              const outputTokens = Math.ceil(response.length / 4)
              const costThb = estimateChatCost(model, inputTokens, outputTokens).thb

              // Always increment usage — AI cost was already incurred regardless of DB save
              await incrementUsage(user.id, 'chat', costThb)

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
                const userMessage = validMessages.find(m => m.role === 'user')
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
              // Track usage even on error — AI API cost was likely incurred
              const errorCostThb = estimateChatCost(model).thb
              incrementUsage(user.id, 'chat', errorCostThb).catch(() => {})
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`))
              controller.close()
            },
          }
        )
      } catch (error) {
        // Track usage if AI was called before error
        const errorCostThb = estimateChatCost(model).thb
        incrementUsage(user.id, 'chat', errorCostThb).catch(() => {})
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
