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

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'RabbitAI',
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
      throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Accumulate chunks in buffer to handle partial lines
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Keep the last incomplete line in buffer
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
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullResponse += content
              callbacks.onChunk(content)
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      callbacks.onDone(fullResponse)
    } finally {
      // Always release the reader lock to prevent memory leak
      reader.releaseLock()
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      callbacks.onDone(fullResponse || '')
      return
    }
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'))
  }
}

// Non-streaming version for simple requests
export async function chatCompletion(
  messages: ChatMessage[],
  model: string
): Promise<{ content: string; tokensUsed?: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured')
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'RabbitAI',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  const tokensUsed = data.usage?.total_tokens

  return { content, tokensUsed }
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
