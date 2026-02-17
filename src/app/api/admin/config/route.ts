import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/admin/config - Get system config (site settings, limits)
export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Check admin access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('*')
      .order('category')
      .order('key')

    if (error) throw error

    // Group by category
    const grouped: Record<string, typeof data> = {}
    data?.forEach(config => {
      if (!grouped[config.category]) {
        grouped[config.category] = []
      }
      grouped[config.category].push(config)
    })

    return NextResponse.json({ settings: data, grouped })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/config - Update system config (owner only)
export async function PATCH(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Check owner access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminData || adminData.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { settings } = body as {
      settings: Record<string, { value: unknown; category?: string; description?: string }>
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings object is required' }, { status: 400 })
    }

    const updates = Object.entries(settings).map(async ([key, config]) => {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: JSON.stringify(config.value),
          category: config.category || 'general',
          description: config.description || null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    })

    await Promise.all(updates)

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: user.id,
      p_action: 'update_config',
      p_resource_type: 'system_config',
      p_resource_id: null,
      p_details: { keys: Object.keys(settings) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
