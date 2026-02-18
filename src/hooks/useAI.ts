'use client'

import { useState, useCallback, useRef } from 'react'
import { getAuthToken } from '@/lib/api-client'
import type { ChatMessage } from '@/lib/byteplus'

interface UseAIState {
  isGenerating: boolean
  error: Error | null
  abortController: AbortController | null
}

interface SearchResult {
  title: string
  url: string
  description: string
  engine?: string
}

interface StreamEvent {
  type: 'chunk' | 'done' | 'error' | 'title' | 'search_results' | 'searching' | 'heartbeat'
  content?: string
  messageId?: string
  message?: string
  title?: string
  searchResults?: SearchResult[]
  autoSearched?: boolean
  auto?: boolean
}

interface GenerateOptions {
  onChunk?: (chunk: string) => void
  onDone?: (fullResponse: string, messageId?: string) => void
  onError?: (error: Error) => void
  onTitleUpdate?: (title: string) => void
  onSearching?: (auto: boolean) => void
  onSearchResults?: (results: SearchResult[]) => void
  webSearch?: boolean
}

export function useAI() {
  const [state, setState] = useState<UseAIState>({
    isGenerating: false,
    error: null,
    abortController: null,
  })

  const fullResponseRef = useRef<string>('')

  const generate = useCallback(async (
    chatId: string,
    messages: ChatMessage[],
    model: string,
    options: GenerateOptions = {}
  ) => {
    const abortController = new AbortController()

    setState({
      isGenerating: true,
      error: null,
      abortController,
    })

    fullResponseRef.current = ''

    try {
      const token = await getAuthToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId,
          messages,
          model,
          webSearch: options.webSearch || false,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
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
            if (!data) continue

            try {
              const event: StreamEvent = JSON.parse(data)

              switch (event.type) {
                case 'chunk':
                  if (event.content) {
                    fullResponseRef.current += event.content
                    options.onChunk?.(event.content)
                  }
                  break
                case 'done':
                  // Use content from event if provided (image gen models include full response with image markers)
                  options.onDone?.(event.content || fullResponseRef.current, event.messageId)
                  break
                case 'error':
                  throw new Error(event.message || 'Generation failed')
                case 'searching':
                  options.onSearching?.(event.auto || false)
                  break
                case 'search_results':
                  if (event.searchResults) {
                    options.onSearchResults?.(event.searchResults)
                  }
                  break
                case 'title':
                  if (event.title) {
                    options.onTitleUpdate?.(event.title)
                  }
                  break
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // Skip invalid JSON
                continue
              }
              throw e
            }
          }
        }
      } finally {
        // Always release the reader lock to prevent memory leak
        reader.releaseLock()
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled or switched chats - don't call onDone to prevent cross-chat leakage
        // The partial content is already saved by handleStop if user explicitly stopped
      } else {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setState(prev => ({ ...prev, error: err }))
        options.onError?.(err)
      }
    } finally {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        abortController: null,
      }))
    }
  }, [])

  const stop = useCallback(() => {
    if (state.abortController) {
      state.abortController.abort()
    }
  }, [state.abortController])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    generate,
    stop,
    clearError,
  }
}
