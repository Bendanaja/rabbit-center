'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authFetch } from '@/lib/api-client'
import type { Chat } from '@/types/database'

interface UseChatsState {
  chats: Chat[]
  loading: boolean
  error: Error | null
}

export function useChats(userId: string | undefined) {
  const [state, setState] = useState<UseChatsState>({
    chats: [],
    loading: true,
    error: null,
  })

  // Store supabase client in ref to avoid recreating on every render
  // This fixes the memory leak where useEffect would re-run due to changing supabase reference
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const fetchChats = useCallback(async () => {
    if (!userId) {
      setState({ chats: [], loading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await authFetch('/api/chat')
      if (!response.ok) {
        throw new Error('Failed to fetch chats')
      }
      const data = await response.json()

      setState({
        chats: data || [],
        loading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch chats'),
      }))
    }
  }, [userId])

  useEffect(() => {
    fetchChats()

    // Subscribe to real-time changes
    if (!userId) return

    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchChats, userId])

  const createChat = useCallback(async (title?: string, modelId?: string): Promise<{ data?: Chat; error?: Error }> => {
    if (!userId) return { error: new Error('No user ID') }

    try {
      const response = await authFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'แชทใหม่',
          model_id: modelId || 'stepfun/step-3.5-flash:free',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create chat')
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to create chat') }
    }
  }, [userId])

  const updateChat = useCallback(async (chatId: string, updates: Partial<Chat>): Promise<{ data?: Chat; error?: Error }> => {
    try {
      const response = await authFetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update chat')
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to update chat') }
    }
  }, [])

  const deleteChat = useCallback(async (chatId: string): Promise<{ error?: Error }> => {
    try {
      const response = await authFetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete chat')
      }

      return {}
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to delete chat') }
    }
  }, [])

  const archiveChat = useCallback(async (chatId: string) => {
    return updateChat(chatId, { is_archived: true })
  }, [updateChat])

  return {
    ...state,
    createChat,
    updateChat,
    deleteChat,
    archiveChat,
    refetch: fetchChats,
  }
}
