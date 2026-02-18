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

// Non-streaming chat for image-generation models (Nano Banana, etc.)
// Handles multipart responses containing text + inline images
export async function chatCompletionOpenRouterMultipart(
  messages: ChatMessage[],
  model: string
): Promise<{ text: string; imageUrls: string[]; tokensUsed?: number }> {
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

  const rawContent = data.choices?.[0]?.message?.content
  const tokensUsed = data.usage?.total_tokens

  let text = ''
  const imageUrls: string[] = []

  if (typeof rawContent === 'string') {
    // Extract inline base64 images from markdown format: ![alt](data:image/...)
    const imgRegex = /!\[[^\]]*\]\((data:image\/[^)]+)\)/g
    let match
    let lastIndex = 0

    while ((match = imgRegex.exec(rawContent)) !== null) {
      text += rawContent.slice(lastIndex, match.index)
      imageUrls.push(match[1])
      lastIndex = match.index + match[0].length
    }

    text += rawContent.slice(lastIndex)
  } else if (Array.isArray(rawContent)) {
    // Multipart content: [{type:"text",text:"..."}, {type:"image_url",image_url:{url:"data:..."}}]
    for (const part of rawContent) {
      if (part.type === 'text') {
        text += part.text || ''
      } else if (part.type === 'image_url') {
        const url = part.image_url?.url
        if (url) imageUrls.push(url)
      }
    }
  }

  return { text: text.trim(), imageUrls, tokensUsed }
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
