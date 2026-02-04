'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserSettings } from '@/types/database'

interface UseUserState {
  profile: UserProfile | null
  settings: UserSettings | null
  loading: boolean
  error: Error | null
}

export function useUser(userId: string | undefined) {
  const [state, setState] = useState<UseUserState>({
    profile: null,
    settings: null,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  const fetchUserData = useCallback(async () => {
    if (!userId) {
      setState({ profile: null, settings: null, loading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Fetch profile and settings in parallel
      const [profileResult, settingsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single(),
      ])

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw profileResult.error
      }

      if (settingsResult.error && settingsResult.error.code !== 'PGRST116') {
        throw settingsResult.error
      }

      setState({
        profile: profileResult.data,
        settings: settingsResult.data,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch user data'),
      }))
    }
  }, [userId])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) return { error: new Error('No user ID') }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { error }
    }

    setState(prev => ({ ...prev, profile: data }))
    return { data }
  }, [userId])

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!userId) return { error: new Error('No user ID') }

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return { error }
    }

    setState(prev => ({ ...prev, settings: data }))
    return { data }
  }, [userId])

  return {
    ...state,
    updateProfile,
    updateSettings,
    refetch: fetchUserData,
  }
}
