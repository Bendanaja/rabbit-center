import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton client instance
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// Reset function for logout
export function resetClient() {
  supabaseInstance = null
}

// Browser client using localStorage for auth persistence
// Uses /supabase proxy to avoid CORS with self-hosted Supabase
export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: use direct URL (no CORS issue)
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

  // Client-side: use singleton with proxy URL + localStorage persistence
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      `${window.location.origin}/supabase`,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: 'rabbithub-auth',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }

  return supabaseInstance
}
