import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats/customers - Customer analytics for Big Data
// GET /api/admin/stats/customers?export=csv - Export customer profiles as CSV
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

  const url = new URL(request.url)
  const exportFormat = url.searchParams.get('export')

  // CSV export mode
  if (exportFormat === 'csv') {
    return handleCsvExport(supabase)
  }

  // Default: JSON analytics
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Run queries in parallel
    const [
      totalResult,
      withPhoneResult,
      active24hResult,
      active7dResult,
      new24hResult,
      new7dResult,
      allProfilesResult,
    ] = await Promise.all([
      // Total customer profiles
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true }),

      // Users with phone numbers
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .not('phone_number', 'is', null),

      // Active in last 24h
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', twentyFourHoursAgo),

      // Active in last 7 days
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', sevenDaysAgo),

      // New in last 24h
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),

      // New in last 7 days
      supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // Get signup source breakdown
      supabase
        .from('customer_profiles')
        .select('signup_source'),
    ])

    // Calculate signup source breakdown
    const sourceBreakdown: Record<string, number> = {}
    allProfilesResult.data?.forEach((profile: { signup_source: string | null }) => {
      const source = profile.signup_source || 'unknown'
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
    })

    return NextResponse.json({
      totalUsers: totalResult.count || 0,
      usersWithPhone: withPhoneResult.count || 0,
      active24h: active24hResult.count || 0,
      active7d: active7dResult.count || 0,
      new24h: new24hResult.count || 0,
      new7d: new7dResult.count || 0,
      bySource: sourceBreakdown,
    })
  } catch (error) {
    console.error('Customer stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCsvExport(supabase: any) {
  try {
    const { data: profiles, error } = await supabase
      .from('customer_profiles')
      .select('user_id, display_name, phone_number, signup_source, total_messages, total_images, total_videos, last_active_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const headers = ['user_id', 'display_name', 'phone_number', 'signup_source', 'total_messages', 'total_images', 'total_videos', 'last_active_at', 'created_at']
    const csvRows = [headers.join(',')]

    for (const profile of profiles || []) {
      const row = headers.map(h => {
        const val = profile[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        // Escape CSV values that contain commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      csvRows.push(row.join(','))
    }

    const csv = csvRows.join('\n')
    const timestamp = new Date().toISOString().split('T')[0]

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customer_profiles_${timestamp}.csv"`,
      },
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: 'Failed to export customer data' },
      { status: 500 }
    )
  }
}
