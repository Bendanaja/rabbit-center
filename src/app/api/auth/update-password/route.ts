import { createAdminClient } from '@/lib/supabase/admin'
import { validateContentType, validateInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
  }

  try {
    const { password, userId } = await request.json()

    if (!password || !userId) {
      return NextResponse.json({ error: 'Password and userId are required' }, { status: 400 })
    }

    const pwErr = validateInput(password, { type: 'string', maxLength: INPUT_LIMITS.password, fieldName: 'password' })
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}
