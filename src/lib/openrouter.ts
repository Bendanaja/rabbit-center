import type { ChatMessage, StreamCallbacks } from './byteplus'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

function getHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter API key not configured')

  return {
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer': 'https://rabbithub.ai',
    'X-Title': 'RabbitHub AI',
    'Content-Type': 'application/json',
  }
}

export async function streamChatOpenRouter(
  messages: ChatMessage[],
  model: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  let fullResponse = ''

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      callbacks.onError(new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError(new Error('No response body'))
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

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

            if (parsed.error) {
              const errMsg = parsed.error?.message || 'OpenRouter provider error'
              callbacks.onError(new Error(errMsg))
              return
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
      }

      callbacks.onDone(fullResponse)
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      callbacks.onDone(fullResponse || '')
      return
    }
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

export async function chatCompletionOpenRouter(
  messages: ChatMessage[],
  model: string
): Promise<{ content: string; tokensUsed?: number }> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter error')
  }

  const content = data.choices?.[0]?.message?.content || ''
  const tokensUsed = data.usage?.total_tokens

  return { content, tokensUsed }
}
