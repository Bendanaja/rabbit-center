import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton client instance
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// Reset function for logout
export function resetClient() {
  supabaseInstance = null
}

// Browser client using localStorage (not cookies)
// This is necessary because Supabase URL is on a different domain (traefik.me)
// which causes cross-origin cookie issues
export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: create fresh instance
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    )
  }

  // Client-side: use singleton with localStorage persistence
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'rabbithub-auth',
          storage: window.localStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return supabaseInstance
}
