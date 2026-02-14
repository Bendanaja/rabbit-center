import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

// GET /api/user/profile - Get current user's profile (auto-create customer_profile if not exists)
export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()

  // Try to get existing customer profile
  const { data: customerProfile, error: cpError } = await adminSupabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (cpError && cpError.code === 'PGRST116') {
    // No customer profile exists, auto-create one
    const { data: newProfile, error: insertError } = await adminSupabase
      .from('customer_profiles')
      .insert({
        user_id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        signup_source: user.app_metadata?.provider || 'email',
      })
      .select()
      .single()

    if (insertError) {
      // If customer_profiles table doesn't exist, fall back to user_profiles
      if (insertError.code === '42P01') {
        const { data: profile } = await adminSupabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        return NextResponse.json({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || '',
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
          ...profile,
        })
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      ...newProfile,
    })
  }

  if (cpError && cpError.code !== 'PGRST116') {
    // If customer_profiles table doesn't exist, fall back to user_profiles
    if (cpError.code === '42P01') {
      const { data: profile } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      return NextResponse.json({
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        ...profile,
      })
    }
    return NextResponse.json({ error: cpError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    ...customerProfile,
  })
}

// PUT /api/user/profile - Update current user's profile
export async function PUT(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { phone_number, display_name, preferences } = body

  // Validate phone_number (Thai format)
  if (phone_number !== undefined && phone_number !== null && phone_number !== '') {
    if (typeof phone_number !== 'string' || phone_number.length > 20) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    // Strip formatting characters for validation
    const cleaned = phone_number.replace(/[-\s]/g, '')
    const thaiPhoneRegex = /^0[0-9]{8,9}$/
    if (!thaiPhoneRegex.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid Thai phone number format' }, { status: 400 })
    }
  }

  // Validate display_name
  if (display_name !== undefined) {
    if (typeof display_name !== 'string' || display_name.length > INPUT_LIMITS.fullName) {
      return NextResponse.json({ error: `display_name exceeds maximum length of ${INPUT_LIMITS.fullName} characters` }, { status: 400 })
    }
  }

  // Validate preferences
  if (preferences !== undefined) {
    if (typeof preferences !== 'object' || Array.isArray(preferences)) {
      return NextResponse.json({ error: 'preferences must be an object' }, { status: 400 })
    }
  }

  const adminSupabase = createAdminClient()

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (phone_number !== undefined) updateData.phone_number = phone_number || null
  if (display_name !== undefined) updateData.display_name = sanitizeInput(display_name)
  if (preferences !== undefined) updateData.preferences = preferences

  // Upsert customer profile
  const { data, error } = await adminSupabase
    .from('customer_profiles')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    // If no row to update, try upsert
    if (error.code === 'PGRST116') {
      const { data: newData, error: upsertError } = await adminSupabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          display_name: display_name ? sanitizeInput(display_name) : user.user_metadata?.full_name || '',
          phone_number: phone_number || null,
          preferences: preferences || {},
          signup_source: user.app_metadata?.provider || 'email',
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }
      return NextResponse.json(newData)
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/user/profile - Update current user's profile (backward compat)
export async function PATCH(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { full_name } = body

  // Validate full_name
  if (full_name !== undefined) {
    if (typeof full_name !== 'string' || full_name.length > INPUT_LIMITS.fullName) {
      return NextResponse.json({ error: `full_name exceeds maximum length of ${INPUT_LIMITS.fullName} characters` }, { status: 400 })
    }
  }

  const safeName = full_name ? sanitizeInput(full_name) : full_name

  const adminSupabase = createAdminClient()

  // Upsert profile
  const { data, error } = await adminSupabase
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        full_name: safeName ?? user.user_metadata?.full_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    // If table doesn't exist, update user metadata instead
    if (error.code === '42P01') {
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { full_name } }
      )

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ full_name, email: user.email })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
