import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats/customers - Customer analytics
// GET /api/admin/stats/customers?export=csv - Export customer data as CSV
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
    const todayStr = now.toISOString().split('T')[0]
    const weekAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Run queries in parallel using actual tables
    const [
      totalResult,
      new24hResult,
      new7dResult,
      activeSubsResult,
      usageRecentResult,
    ] = await Promise.all([
      // Total user profiles
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),

      // New users in last 24h
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),

      // New users in last 7 days
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo),

      // Active paid subscriptions
      supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('status', 'active')
        .neq('plan_id', 'free'),

      // Active users (from usage_records in last 7 days)
      supabase
        .from('usage_records')
        .select('user_id, date')
        .gte('date', weekAgoStr),
    ])

    // Calculate active users from usage records
    const activeToday = new Set(
      (usageRecentResult.data || [])
        .filter(u => u.date === todayStr)
        .map(u => u.user_id)
    ).size

    const active7d = new Set(
      (usageRecentResult.data || []).map(u => u.user_id)
    ).size

    // Plan breakdown
    const planBreakdown: Record<string, number> = {}
    ;(activeSubsResult.data || []).forEach(s => {
      planBreakdown[s.plan_id] = (planBreakdown[s.plan_id] || 0) + 1
    })

    return NextResponse.json({
      totalUsers: totalResult.count || 0,
      paidUsers: activeSubsResult.data?.length || 0,
      active24h: activeToday,
      active7d: active7d,
      new24h: new24hResult.count || 0,
      new7d: new7dResult.count || 0,
      byPlan: planBreakdown,
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
    // Get user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10000)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Get subscriptions for these users
    const userIds = (profiles || []).map((p: { user_id: string }) => p.user_id)
    const { data: subscriptions } = userIds.length > 0
      ? await supabase
          .from('subscriptions')
          .select('user_id, plan_id, status')
          .in('user_id', userIds)
          .eq('status', 'active')
      : { data: [] }

    const subsMap = Object.fromEntries(
      (subscriptions || []).map((s: { user_id: string; plan_id: string }) => [s.user_id, s.plan_id])
    )

    const headers = ['user_id', 'display_name', 'plan', 'created_at', 'updated_at']
    const csvRows = [headers.join(',')]

    for (const profile of profiles || []) {
      const row = [
        profile.user_id,
        profile.display_name || '',
        subsMap[profile.user_id] || 'free',
        profile.created_at || '',
        profile.updated_at || '',
      ].map(val => {
        const str = String(val)
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
