const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onDone: (fullResponse: string) => void
  onError: (error: Error) => void
}

export const OPENROUTER_MODELS = {
  // Free models (working & available)
  'step-flash-free': { id: 'stepfun/step-3.5-flash:free', name: 'Step 3.5 Flash', provider: 'StepFun', icon: '/images/models/stepfun.svg', isFree: true, isLocked: false },
  'nemotron-nano-free': { id: 'nvidia/nemotron-nano-9b-v2:free', name: 'Nemotron Nano 9B', provider: 'NVIDIA', icon: '/images/models/nvidia.svg', isFree: true, isLocked: false },
  'glm-4.5-air-free': { id: 'z-ai/glm-4.5-air:free', name: 'GLM-4.5 Air', provider: 'Z.AI', icon: '/images/models/zhipu.svg', isFree: true, isLocked: false },

  // OpenAI (Pro required)
  'gpt-4o': { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', icon: '/images/models/openai.svg', isFree: false, isLocked: true },
  'gpt-4o-mini': { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', icon: '/images/models/openai.svg', isFree: false, isLocked: true },

  // Anthropic (Pro required)
  'claude-3.5-sonnet': { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', icon: '/images/models/anthropic.svg', isFree: false, isLocked: true },
  'claude-3-haiku': { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', icon: '/images/models/anthropic.svg', isFree: false, isLocked: true },

  // Google (Pro required)
  'gemini-pro-1.5': { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', icon: '/images/models/google.svg', isFree: false, isLocked: true },

  // Meta (Pro required)
  'llama-3.1-70b': { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', icon: '/images/models/meta.svg', isFree: false, isLocked: true },

  // Mistral (Pro required)
  'mistral-large': { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', icon: '/images/models/mistral.svg', isFree: false, isLocked: true },
} as const

export type ModelKey = keyof typeof OPENROUTER_MODELS

export function getModelById(modelId: string) {
  return Object.values(OPENROUTER_MODELS).find(m => m.id === modelId)
}

export function getFreeModels() {
  return Object.entries(OPENROUTER_MODELS)
    .filter(([, model]) => model.isFree)
    .map(([key, model]) => ({ key, ...model }))
}

export function getAvailableModels() {
  return Object.entries(OPENROUTER_MODELS)
    .filter(([, model]) => !model.isLocked)
    .map(([key, model]) => ({ key, ...model }))
}

export function getLockedModels() {
  return Object.entries(OPENROUTER_MODELS)
    .filter(([, model]) => model.isLocked)
    .map(([key, model]) => ({ key, ...model }))
}

export function getAllModels() {
  return Object.entries(OPENROUTER_MODELS)
    .map(([key, model]) => ({ key, ...model }))
}

// Get fallback free model IDs (excluding the given model)
function getFreeFallbacks(excludeModel: string): string[] {
  return Object.values(OPENROUTER_MODELS)
    .filter(m => m.isFree && m.id !== excludeModel)
    .map(m => m.id)
}

async function tryStreamChat(
  messages: ChatMessage[],
  model: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ reader: ReadableStreamDefaultReader<Uint8Array> } | { error: string }> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'RabbitHub',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      route: 'fallback',
    }),
    signal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    return { error: errorData.error?.message || `OpenRouter error: ${response.status}` }
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
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    callbacks.onError(new Error('OpenRouter API key not configured'))
    return
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
      const result = await tryStreamChat(messages, currentModel, apiKey, signal)

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
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  const modelsToTry = [model, ...getFreeFallbacks(model)]

  for (const currentModel of modelsToTry) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'RabbitHub',
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          stream: false,
          route: 'fallback',
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

// Generate chat title from first message
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
      'stepfun/step-3.5-flash:free' // Use free model for title generation
    )

    return content.trim().slice(0, 100) || 'แชทใหม่'
  } catch {
    // Fallback to first few words of the message
    const words = firstMessage.split(' ').slice(0, 5).join(' ')
    return words.length > 50 ? words.slice(0, 50) + '...' : words || 'แชทใหม่'
  }
}
