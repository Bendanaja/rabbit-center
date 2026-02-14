'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  const isMountedRef = useRef(true)
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    isMountedRef.current = true
    const supabase = supabaseRef.current

    // Clean up stale session key from previous CORS workaround
    try { window.localStorage.removeItem('rabbithub-session') } catch {}

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMountedRef.current) return

      if (error) {
        // Invalid/expired refresh token - clear stale session and start fresh
        console.warn('[Auth] Session error, clearing stale data:', error.message)
        supabase.auth.signOut().catch(() => {})
        setAuthState({ user: null, session: null, loading: false, error: null })
        return
      }

      console.log(session ? `[Auth] Session found: ${session.user.email}` : '[Auth] No session found')
      setAuthState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        error: null,
      })
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMountedRef.current) {
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      isMountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { data, error } = await supabaseRef.current.auth.signInWithPassword({ email, password })
      if (error) {
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false, error }))
        }
        return { error }
      }
      // onAuthStateChange will update state automatically
      return { data }
    } catch {
      const error = { message: 'Network error' } as AuthError
      if (isMountedRef.current) {
        setAuthState(prev => ({ ...prev, loading: false, error }))
      }
      return { error }
    }
  }, [])

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    metadata?: { full_name?: string; phone_number?: string }
  ) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Use custom API route that bypasses email confirmation
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          phone_number: metadata?.phone_number,
          full_name: metadata?.full_name,
        }),
      })

      if (!isMountedRef.current) return { error: null }

      const result = await response.json()

      if (!response.ok) {
        const error = { message: result.error || 'Failed to create account' } as AuthError
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false, error }))
        }
        return { error }
      }

      // Auto sign in after signup
      const { data, error } = await supabaseRef.current.auth.signInWithPassword({ email, password })
      if (error) {
        // Signup succeeded but auto-login failed
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
        return { data: { user: result.user, session: null } }
      }

      // onAuthStateChange will update state
      return { data }
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return { error: null }
      }
      const error = { message: 'Network error' } as AuthError
      if (isMountedRef.current) {
        setAuthState(prev => ({ ...prev, loading: false, error }))
      }
      return { error }
    }
  }, [])

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'facebook') => {
    const { data, error } = await supabaseRef.current.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut()
    // Also clear the old session key if it exists
    try { window.localStorage.removeItem('rabbithub-session') } catch {}
    if (isMountedRef.current) {
      setAuthState({ user: null, session: null, loading: false, error: null })
    }
    return {}
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    return { error }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabaseRef.current.auth.updateUser({ password: newPassword })
    return { error }
  }, [])

  return {
    ...authState,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
  }
}
