import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Get user from Authorization header
// This is needed because we use localStorage for auth (cross-origin cookie issues)
export async function getUserFromRequest(request: Request): Promise<{ user: User | null; error: string | null }> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return { user: null, error: 'Missing token' }
  }

  try {
    // Create a client with the user's token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    )

    // Verify the token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' }
    }

    return { user, error: null }
  } catch (err) {
    return { user: null, error: 'Failed to verify token' }
  }
}
