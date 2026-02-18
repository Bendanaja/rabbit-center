const BYTEPLUS_BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onDone: (fullResponse: string) => void
  onError: (error: Error) => void
}

export type ModelType = 'chat' | 'image' | 'video'

export interface ModelDefinition {
  id: string
  name: string
  provider: string
  icon: string
  isFree: boolean
  isLocked: boolean
  modelType: ModelType
  apiProvider: 'byteplus' | 'openrouter'
  capabilities?: string[] // e.g. ['t2i', 'i2i'] or ['t2v', 'i2v']
  maxContextTokens?: number // Max input context window for chat models
}

export const MODELS: Record<string, ModelDefinition> = {
  // ═══════════════════════════════════════════
  // BytePlus ModelArk — Chat/LLM (Free)
  // ═══════════════════════════════════════════
  'deepseek-r1': { id: 'deepseek-r1-250528', name: 'DeepSeek R1', provider: 'DeepSeek', icon: '/images/models/deepseek.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'deepseek-v3-2': { id: 'deepseek-v3-2-251201', name: 'DeepSeek V3.2', provider: 'DeepSeek', icon: '/images/models/deepseek.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'deepseek-v3-1': { id: 'deepseek-v3-1-250821', name: 'DeepSeek V3.1', provider: 'DeepSeek', icon: '/images/models/deepseek.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'seed-1-8': { id: 'seed-1-8-251228', name: 'Seed 1.8', provider: 'ByteDance', icon: '/images/models/byteplus.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'seed-1-6': { id: 'seed-1-6-250915', name: 'Seed 1.6', provider: 'ByteDance', icon: '/images/models/byteplus.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'seed-1-6-flash': { id: 'seed-1-6-flash-250715', name: 'Seed 1.6 Flash', provider: 'ByteDance', icon: '/images/models/byteplus.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'kimi-k2-thinking': { id: 'kimi-k2-thinking-251104', name: 'Kimi K2 Thinking', provider: 'Moonshot', icon: '/images/models/kimi.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'kimi-k2': { id: 'kimi-k2-250905', name: 'Kimi K2', provider: 'Moonshot', icon: '/images/models/kimi.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'glm-4': { id: 'glm-4-7-251222', name: 'GLM-4.7', provider: 'Zhipu AI', icon: '/images/models/zhipu.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'byteplus', maxContextTokens: 128_000 },
  'gpt-oss-120b': { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', icon: '/images/models/openai.svg', isFree: true, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 131_000 },

  // ═══════════════════════════════════════════
  // OpenRouter Models
  // ═══════════════════════════════════════════
  'nano-banana': { id: 'google/gemini-2.5-flash-image-preview', name: 'Nano Banana', provider: 'Google', icon: '/images/models/google.svg', isFree: false, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 32_768, capabilities: ['chat-image-gen'] },
  'nano-banana-pro': { id: 'google/gemini-3-pro-image-preview', name: 'Nano Banana Pro', provider: 'Google', icon: '/images/models/google.svg', isFree: false, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 32_768, capabilities: ['chat-image-gen'] },
  'gpt-5-2': { id: 'openai/gpt-5.2', name: 'GPT 5.2', provider: 'OpenAI', icon: '/images/models/openai.svg', isFree: false, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 400_000 },
  'grok-4': { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', icon: '/images/models/xai.svg', isFree: false, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 256_000 },
  'claude-4-6': { id: 'anthropic/claude-opus-4-6', name: 'Claude 4.6 Opus', provider: 'Anthropic', icon: '/images/models/anthropic.svg', isFree: false, isLocked: false, modelType: 'chat', apiProvider: 'openrouter', maxContextTokens: 200_000 },

  // ═══════════════════════════════════════════
  // BytePlus ModelArk — Image Generation (Free)
  // ═══════════════════════════════════════════
  'seedream-3': { id: 'seedream-3-0-t2i-250415', name: 'Seedream 3.0', provider: 'ByteDance', icon: '/images/models/seedream.svg', isFree: true, isLocked: false, modelType: 'image', apiProvider: 'byteplus', capabilities: ['t2i'] },
  'seedream-4': { id: 'seedream-4-0-250828', name: 'Seedream 4.0', provider: 'ByteDance', icon: '/images/models/seedream.svg', isFree: true, isLocked: false, modelType: 'image', apiProvider: 'byteplus', capabilities: ['t2i', 'i2i'] },
  'seedream-4-5': { id: 'seedream-4-5-251128', name: 'Seedream 4.5', provider: 'ByteDance', icon: '/images/models/seedream.svg', isFree: true, isLocked: false, modelType: 'image', apiProvider: 'byteplus', capabilities: ['t2i', 'i2i'] },

  // ═══════════════════════════════════════════
  // BytePlus ModelArk — Video Generation (Free)
  // ═══════════════════════════════════════════
  'seedance-lite-t2v': { id: 'seedance-1-0-lite-t2v-250428', name: 'Seedance Lite (T2V)', provider: 'ByteDance', icon: '/images/models/seedance.svg', isFree: true, isLocked: false, modelType: 'video', apiProvider: 'byteplus', capabilities: ['t2v'] },
  'seedance-lite-i2v': { id: 'seedance-1-0-lite-i2v-250428', name: 'Seedance Lite (I2V)', provider: 'ByteDance', icon: '/images/models/seedance.svg', isFree: true, isLocked: false, modelType: 'video', apiProvider: 'byteplus', capabilities: ['i2v'] },
  'seedance-pro': { id: 'seedance-1-0-pro-250528', name: 'Seedance Pro', provider: 'ByteDance', icon: '/images/models/seedance.svg', isFree: true, isLocked: false, modelType: 'video', apiProvider: 'byteplus', capabilities: ['t2v', 'i2v'] },
  'seedance-pro-fast': { id: 'seedance-1-0-pro-fast-251015', name: 'Seedance Pro Fast', provider: 'ByteDance', icon: '/images/models/seedance.svg', isFree: true, isLocked: false, modelType: 'video', apiProvider: 'byteplus', capabilities: ['t2v', 'i2v'] },
  'seedance-1-5-pro': { id: 'seedance-1-5-pro-251215', name: 'Seedance 1.5 Pro', provider: 'ByteDance', icon: '/images/models/seedance.svg', isFree: true, isLocked: false, modelType: 'video', apiProvider: 'byteplus', capabilities: ['t2v', 'i2v'] },
} as const

export type ModelKey = keyof typeof MODELS

// ─── Query helpers ───────────────────────────────────────

export function getModelById(modelId: string) {
  // Try matching by full versioned ID first (e.g. 'deepseek-v3-2-251201')
  const byId = Object.values(MODELS).find(m => m.id === modelId)
  if (byId) return byId
  // Fallback: try matching by short key (e.g. 'deepseek-v3-2')
  return MODELS[modelId] || undefined
}

/** Resolve a full model ID (e.g. 'deepseek-v3-2-251201') to its short key (e.g. 'deepseek-v3-2') */
export function getModelKey(modelId: string): string | undefined {
  const entry = Object.entries(MODELS).find(([, model]) => model.id === modelId)
  return entry?.[0]
}

export function getModelType(modelId: string): ModelType {
  const model = getModelById(modelId)
  return model?.modelType || 'chat'
}

export function getFreeModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => model.isFree)
    .map(([key, model]) => ({ key, ...model }))
}

export function getAvailableModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => !model.isLocked && model.modelType === 'chat')
    .map(([key, model]) => ({ key, ...model }))
}

export function getLockedModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => model.isLocked && model.modelType === 'chat')
    .map(([key, model]) => ({ key, ...model }))
}

export function getAllModels() {
  return Object.entries(MODELS)
    .map(([key, model]) => ({ key, ...model }))
}

export function getChatModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => model.modelType === 'chat' && !model.isLocked)
    .map(([key, model]) => ({ key, ...model }))
}

export function getImageModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => model.modelType === 'image')
    .map(([key, model]) => ({ key, ...model }))
}

export function isImageGenChatModel(modelId: string): boolean {
  const model = getModelById(modelId) || MODELS[getModelKey(modelId) || '']
  return model?.capabilities?.includes('chat-image-gen') ?? false
}

export function getVideoModels() {
  return Object.entries(MODELS)
    .filter(([, model]) => model.modelType === 'video')
    .map(([key, model]) => ({ key, ...model }))
}

// ─── Token estimation & context building ─────────────────

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

const DEFAULT_MAX_CONTEXT_TOKENS = 128_000
const RESPONSE_RESERVE_TOKENS = 4_000

/** Cheapest/fastest model for internal tasks (compaction, title gen, search classification, etc.) */
export const COMPACT_MODEL = 'openai/gpt-oss-120b'

export function buildContextMessages<T extends { content: string }>(
  messages: T[],
  maxTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): { messages: T[]; usagePercent: number } {
  const availableTokens = maxTokens - RESPONSE_RESERVE_TOKENS

  const result: T[] = []
  let totalTokens = 0

  // Work backwards from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content) + 4 // +4 for role overhead
    if (totalTokens + msgTokens > availableTokens) break
    result.unshift(messages[i])
    totalTokens += msgTokens
  }

  return {
    messages: result,
    usagePercent: Math.round((totalTokens / availableTokens) * 100),
  }
}

// ─── Chat fallback logic ─────────────────────────────────

function getFreeFallbacks(excludeModel: string): string[] {
  return Object.values(MODELS)
    .filter(m => m.isFree && m.modelType === 'chat' && m.apiProvider === 'byteplus' && m.id !== excludeModel)
    .map(m => m.id)
}

async function tryStreamChat(
  messages: ChatMessage[],
  model: string,
  signal?: AbortSignal
): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array> } | { error: string }> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return { error: 'BytePlus API key not configured' }

  const response = await fetch(`${BYTEPLUS_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return { error: errorData.error?.message || `API error: ${response.status}` }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    return { error: 'No response body' }
  }

  return { reader }
}

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  // Route OpenRouter models to the OpenRouter client
  const modelDef = getModelById(model) || MODELS[getModelKey(model) || '']
  if (modelDef?.apiProvider === 'openrouter') {
    const { streamChatOpenRouter } = await import('./openrouter')
    return streamChatOpenRouter(messages, modelDef.id, callbacks, signal)
  }

  // Fallback: detect OpenRouter models by ID format (contains '/')
  // This handles models added from OpenRouter admin panel that aren't in the MODELS registry
  if (!modelDef && model.includes('/')) {
    const { streamChatOpenRouter } = await import('./openrouter')
    return streamChatOpenRouter(messages, model, callbacks, signal)
  }

  let fullResponse = ''

  // Models to try: requested model first, then free fallbacks
  const modelsToTry = [model, ...getFreeFallbacks(model)]

  for (const currentModel of modelsToTry) {
    if (signal?.aborted) {
      callbacks.onDone(fullResponse || '')
      return
    }

    try {
      const result = await tryStreamChat(messages, currentModel, signal)

      if ('error' in result) {
        console.warn(`Model ${currentModel} failed: ${result.error}, trying next...`)
        continue
      }

      const { reader } = result
      const decoder = new TextDecoder()
      let buffer = ''
      let streamError = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue

            const data = line.slice(6).trim()
            if (data === '[DONE]') {
              callbacks.onDone(fullResponse)
              return
            }

            try {
              const parsed = JSON.parse(data)

              // Detect provider errors in SSE stream
              if (parsed.error) {
                const errMsg = parsed.error?.message || parsed.error?.metadata?.raw || 'Provider error'
                console.warn(`Stream error from ${currentModel}: ${errMsg}, trying next...`)
                streamError = true
                break
              }

              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullResponse += content
                callbacks.onChunk(content)
              }
            } catch {
              // Skip invalid JSON
            }
          }

          if (streamError) break
        }

        // If we got content before the error, deliver what we have
        if (streamError && fullResponse) {
          callbacks.onDone(fullResponse)
          return
        }

        // If stream error with no content, try next model
        if (streamError) {
          fullResponse = ''
          continue
        }

        callbacks.onDone(fullResponse)
        return
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onDone(fullResponse || '')
        return
      }
      console.warn(`Model ${currentModel} threw: ${error}, trying next...`)
      continue
    }
  }

  // All models failed
  callbacks.onError(new Error('AI ไม่สามารถตอบกลับได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'))
}

// Non-streaming version for simple requests (with auto-retry on free models)
export async function chatCompletion(
  messages: ChatMessage[],
  model: string
): Promise<{ content: string; tokensUsed?: number }> {
  // Route OpenRouter models to the OpenRouter client
  const modelDef = getModelById(model) || MODELS[getModelKey(model) || '']
  if (modelDef?.apiProvider === 'openrouter') {
    const { chatCompletionOpenRouter } = await import('./openrouter')
    return chatCompletionOpenRouter(messages, modelDef.id)
  }
  // Direct OpenRouter model ID (e.g. 'openai/gpt-oss-120b') not in MODELS registry
  if (!modelDef && model.includes('/')) {
    const { chatCompletionOpenRouter } = await import('./openrouter')
    return chatCompletionOpenRouter(messages, model)
  }

  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) throw new Error('BytePlus API key not configured')

  const modelsToTry = [model, ...getFreeFallbacks(model)]

  for (const currentModel of modelsToTry) {
    try {
      const response = await fetch(`${BYTEPLUS_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.warn(`chatCompletion ${currentModel} failed: ${errorData.error?.message}`)
        continue
      }

      const data = await response.json()

      // Check for error in response body
      if (data.error) {
        console.warn(`chatCompletion ${currentModel} returned error: ${data.error.message}`)
        continue
      }

      const content = data.choices?.[0]?.message?.content || ''
      const tokensUsed = data.usage?.total_tokens

      return { content, tokensUsed }
    } catch (error) {
      console.warn(`chatCompletion ${currentModel} threw: ${error}`)
      continue
    }
  }

  throw new Error('AI ไม่สามารถตอบกลับได้ในขณะนี้')
}

// ─── Image Generation (BytePlus Seedream) ────────────────

export interface ImageGenerationOptions {
  prompt: string
  model?: string
  size?: string
  n?: number
  seed?: number
  guidance_scale?: number
  image?: string // Reference image URL or base64 data URL for i2i
}

export async function generateImage(options: ImageGenerationOptions): Promise<{
  images: Array<{ url?: string; b64_json?: string }>
}> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) throw new Error('BytePlus API key not configured')

  const model = options.model || 'seedream-4-5-251128'

  const body: Record<string, unknown> = {
    model,
    prompt: options.prompt,
    size: options.size || '1024x1024',
    n: options.n || 1,
    ...(options.seed != null ? { seed: options.seed } : {}),
    ...(options.guidance_scale != null ? { guidance_scale: options.guidance_scale } : {}),
  }

  // Add reference image for i2i
  if (options.image) {
    body.image = options.image
  }

  const response = await fetch(`${BYTEPLUS_BASE_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Image generation failed: ${response.status}`)
  }

  const data = await response.json()
  return { images: data.data || [] }
}

// ─── Video Generation (BytePlus Seedance) ────────────────

export interface VideoGenerationOptions {
  prompt: string
  model?: string
  duration?: number
  image_url?: string // for image-to-video
  seed?: number
}

export async function generateVideo(options: VideoGenerationOptions): Promise<{
  taskId: string
}> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) throw new Error('BytePlus API key not configured')

  const model = options.model || 'seedance-1-5-pro-251215'

  const body: Record<string, unknown> = {
    model,
    content: [
      {
        type: 'text',
        text: options.prompt,
      },
    ],
  }

  if (options.image_url) {
    body.content = [
      {
        type: 'image_url',
        image_url: { url: options.image_url },
      },
      {
        type: 'text',
        text: options.prompt,
      },
    ]
  }

  if (options.duration) body.duration = options.duration
  if (options.seed != null) body.seed = options.seed

  const response = await fetch(`${BYTEPLUS_BASE_URL}/contents/generations/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Video generation failed: ${response.status}`)
  }

  const data = await response.json()
  return { taskId: data.id || data.task_id }
}

export async function checkVideoStatus(taskId: string): Promise<{
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}> {
  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) throw new Error('BytePlus API key not configured')

  const response = await fetch(`${BYTEPLUS_BASE_URL}/contents/generations/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Status check failed: ${response.status}`)
  }

  const data = await response.json()

  if (data.status === 'completed' || data.status === 'succeeded') {
    const videoUrl = data.content?.video_url || data.content?.[0]?.url || data.data?.[0]?.url
    return { status: 'completed', videoUrl }
  }

  if (data.status === 'failed') {
    return { status: 'failed', error: data.error?.message || 'Video generation failed' }
  }

  return { status: 'processing' }
}

// ─── Title generation ────────────────────────────────────

export async function generateChatTitle(firstMessage: string): Promise<string> {
  try {
    const { content } = await chatCompletion(
      [
        {
          role: 'system',
          content: 'Create a short title (3-6 words) in Thai for this conversation. Only respond with the title, no quotes or extra text.',
        },
        {
          role: 'user',
          content: firstMessage,
        },
      ],
      'seed-1-6-flash-250715' // Use BytePlus Seed Flash for title generation (fast & free)
    )

    return content.trim().slice(0, 100) || 'แชทใหม่'
  } catch {
    // Fallback to first few words of the message
    const words = firstMessage.split(' ').slice(0, 5).join(' ')
    return words.length > 50 ? words.slice(0, 50) + '...' : words || 'แชทใหม่'
  }
}
