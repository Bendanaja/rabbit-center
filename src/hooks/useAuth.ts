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

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true)
  // Store supabase client in ref to avoid recreating
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    isMountedRef.current = true
    const supabase = supabaseRef.current

    // Timeout to prevent infinite loading (3 seconds max)
    // This will be cleared when getSession() completes successfully or on error
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setAuthState(prev => {
          if (prev.loading) {
            console.log('[Auth] Timeout - setting loading to false')
            return { ...prev, loading: false }
          }
          return prev
        })
      }
    }, 3000)

    // Auth initialization - localStorage is synchronous, so this should be fast
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        // Clear timeout on successful completion to prevent race condition
        clearTimeout(timeoutId)
        if (!isMountedRef.current) return

        if (error) {
          console.warn('[Auth] getSession error:', error.message)
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          })
          return
        }

        if (session?.user) {
          console.log('[Auth] Session found:', session.user.email)
          setAuthState({
            user: session.user,
            session: session,
            loading: false,
            error: null,
          })
        } else {
          console.log('[Auth] No session found')
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          })
        }
      } catch (err: unknown) {
        // Clear timeout on error to prevent race condition
        clearTimeout(timeoutId)
        // On AbortError, still set loading to false if mounted
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
          return
        }
        console.warn('[Auth] Init error:', err)
      }
    }
    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMountedRef.current) return

      // Use session.user directly to avoid race condition
      // Previously: await getUser() could fail if component unmounts during the call
      if (session) {
        setAuthState({
          user: session.user,
          session: session,
          loading: false,
          error: null,
        })
      } else {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => {
      isMountedRef.current = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false, error }))
        }
        return { error }
      }

      // Update auth state immediately after successful login
      if (data.session && data.user) {
        if (isMountedRef.current) {
          setAuthState({
            user: data.user,
            session: data.session,
            loading: false,
            error: null,
          })
        }
      }

      return { data }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return { error: null }
      }
      const error = err as AuthError
      if (isMountedRef.current) {
        setAuthState(prev => ({ ...prev, loading: false, error }))
      }
      return { error }
    }
  }, [])

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    metadata?: { full_name?: string }
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
      const { data: signInData, error: signInError } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password,
      })

      if (!isMountedRef.current) return { error: null }

      if (signInError) {
        setAuthState(prev => ({ ...prev, loading: false, error: signInError }))
        return { error: signInError }
      }

      return { data: signInData }
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

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabaseRef.current.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, error }))
        }
        return { error }
      }

      return {}
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return {}
      }
      return { error: err as AuthError }
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabaseRef.current.auth.signOut()

      if (error) {
        if (isMountedRef.current) {
          setAuthState(prev => ({ ...prev, loading: false, error }))
        }
        return { error }
      }

      if (isMountedRef.current) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        })
      }

      return {}
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return {}
      }
      return { error: err as AuthError }
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error }
      }

      return {}
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return {}
      }
      return { error: err as AuthError }
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabaseRef.current.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { error }
      }

      return {}
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('aborted'))) {
        return {}
      }
      return { error: err as AuthError }
    }
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
