'use client'

import { useEffect } from 'react'

// Suppress AbortError from Supabase when components unmount
// This is harmless noise that occurs during normal React component lifecycle
export function ErrorSuppressor() {
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn

    // Helper to check if message is AbortError related
    const isAbortError = (arg: unknown): boolean => {
      if (!arg) return false
      const str = String(arg)
      return (
        str.includes('AbortError') ||
        str.includes('signal is aborted') ||
        str.includes('aborted without reason') ||
        str.includes('The operation was aborted')
      )
    }

    console.error = (...args) => {
      // Suppress AbortError messages
      if (args.some(isAbortError)) {
        return // Silently ignore
      }
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      // Suppress AbortError warnings too
      if (args.some(isAbortError)) {
        return // Silently ignore
      }
      originalWarn.apply(console, args)
    }

    // Handle unhandled promise rejections for AbortError
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (
        reason?.name === 'AbortError' ||
        reason?.message?.includes('aborted') ||
        reason?.message?.includes('signal is aborted') ||
        String(reason).includes('AbortError')
      ) {
        event.preventDefault() // Prevent the error from showing
        event.stopImmediatePropagation()
      }
    }

    // Handle global errors for AbortError
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.name === 'AbortError' ||
        event.message?.includes('aborted') ||
        event.message?.includes('signal is aborted') ||
        event.message?.includes('AbortError')
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
    window.addEventListener('error', handleError, true)

    return () => {
      console.error = originalError
      console.warn = originalWarn
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
      window.removeEventListener('error', handleError, true)
    }
  }, [])

  return null
}
