import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client with service role - use only in server-side code
// This client bypasses RLS and doesn't use strict Database types
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
