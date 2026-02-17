'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface RealtimeSubscription {
  table: string
  schema?: string
  event?: RealtimeEvent
  filter?: string
}

/**
 * Subscribe to Supabase Realtime changes on one or more tables.
 * Calls `onChange` whenever a matching event occurs.
 *
 * @param subscriptions - Array of table subscriptions
 * @param onChangeCallback - Called on every matching change (debounced)
 * @param enabled - Whether the subscription is active
 */
export function useRealtime(
  subscriptions: RealtimeSubscription[],
  onChangeCallback: () => void,
  enabled = true
) {
  const supabaseRef = useRef(createClient())
  const callbackRef = useRef(onChangeCallback)
  callbackRef.current = onChangeCallback

  // Debounce: if multiple events fire rapidly, only refetch once
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedCallback = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      callbackRef.current()
    }, 150)
  }

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return

    const supabase = supabaseRef.current
    const channelName = `rt-${subscriptions.map(s => s.table).join('-')}-${Date.now()}`

    let channel = supabase.channel(channelName)

    for (const sub of subscriptions) {
      channel = channel.on(
        'postgres_changes',
        {
          event: sub.event || '*',
          schema: sub.schema || 'public',
          table: sub.table,
          ...(sub.filter ? { filter: sub.filter } : {}),
        },
        debouncedCallback
      )
    }

    channel.subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
    }
  }, [enabled, JSON.stringify(subscriptions)])
}
