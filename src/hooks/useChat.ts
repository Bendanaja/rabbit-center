'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authFetch } from '@/lib/api-client'
import type { Chat, Message } from '@/types/database'

interface UseChatState {
  chat: Chat | null
  messages: Message[]
  loading: boolean
  error: Error | null
}

export function useChat(chatId: string | undefined) {
  const [state, setState] = useState<UseChatState>({
    chat: null,
    messages: [],
    loading: true,
    error: null,
  })

  // Store supabase client in ref to avoid recreating on every render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchChat = useCallback(async () => {
    if (!chatId) {
      setState({ chat: null, messages: [], loading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch chat and messages in parallel via API routes
      const [chatResponse, messagesResponse] = await Promise.all([
        authFetch(`/api/chat/${chatId}`),
        authFetch(`/api/chat/${chatId}/messages`),
      ])

      if (!chatResponse.ok) {
        throw new Error('Failed to fetch chat')
      }
      if (!messagesResponse.ok) {
        throw new Error('Failed to fetch messages')
      }

      const chatData = await chatResponse.json()
      const messagesData = await messagesResponse.json()

      setState({
        chat: chatData,
        messages: messagesData || [],
        loading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch chat'),
      }))
    }
  }, [chatId])

  useEffect(() => {
    fetchChat()

    // Subscribe to real-time message changes
    if (!chatId) return

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setState(prev => {
            // Check if message already exists (avoid duplicates from optimistic updates)
            const exists = prev.messages.some(
              m => m.id === newMessage.id ||
              (m.content === newMessage.content && m.role === newMessage.role &&
               Math.abs(new Date(m.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000)
            )
            if (exists) {
              // Replace temp message with real one if content matches
              return {
                ...prev,
                messages: prev.messages.map(m => {
                  if (m.id.startsWith('temp-') && m.content === newMessage.content && m.role === newMessage.role) {
                    return newMessage
                  }
                  return m
                })
              }
            }
            return {
              ...prev,
              messages: [...prev.messages, newMessage],
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchChat, chatId])

  const sendMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user'): Promise<{ data?: Message; error?: Error }> => {
    if (!chatId) return { error: new Error('No chat ID') }

    try {
      const response = await authFetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          role,
          content,
          model_id: state.chat?.model_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to send message') }
    }
  }, [chatId, state.chat?.model_id])

  const updateChatTitle = useCallback(async (title: string): Promise<{ data?: Chat; error?: Error }> => {
    if (!chatId) return { error: new Error('No chat ID') }

    try {
      const response = await authFetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update title')
      }

      const data = await response.json()
      setState(prev => ({ ...prev, chat: data }))
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to update title') }
    }
  }, [chatId])

  const updateChatModel = useCallback(async (modelId: string): Promise<{ data?: Chat; error?: Error }> => {
    if (!chatId) return { error: new Error('No chat ID') }

    try {
      const response = await authFetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify({ model_id: modelId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update model')
      }

      const data = await response.json()
      setState(prev => ({ ...prev, chat: data }))
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to update model') }
    }
  }, [chatId])

  const clearMessages = useCallback(async (): Promise<{ error?: Error }> => {
    if (!chatId) return { error: new Error('No chat ID') }

    try {
      const response = await authFetch(`/api/chat/${chatId}/messages`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clear messages')
      }

      setState(prev => ({ ...prev, messages: [] }))
      return {}
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to clear messages') }
    }
  }, [chatId])

  // Optimistic add message (for streaming)
  const addOptimisticMessage = useCallback((message: Partial<Message>) => {
    const optimisticMessage: Message = {
      id: `temp-${crypto.randomUUID()}`,
      chat_id: chatId || '',
      role: message.role || 'assistant',
      content: message.content || '',
      model_id: state.chat?.model_id || null,
      tokens_used: null,
      created_at: new Date().toISOString(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
    }))

    return optimisticMessage.id
  }, [chatId, state.chat?.model_id])

  // Update optimistic message content (for streaming)
  const updateOptimisticMessage = useCallback((tempId: string, content: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === tempId ? { ...msg, content } : msg
      ),
    }))
  }, [])

  // Replace optimistic message with real one
  const replaceOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === tempId ? realMessage : msg
      ),
    }))
  }, [])

  return {
    ...state,
    sendMessage,
    updateChatTitle,
    updateChatModel,
    clearMessages,
    addOptimisticMessage,
    updateOptimisticMessage,
    replaceOptimisticMessage,
    refetch: fetchChat,
  }
}
