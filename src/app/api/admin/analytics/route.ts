import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const range = searchParams.get('range') || '30d'

  const now = new Date()
  let startDate: Date
  switch (range) {
    case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
    case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
    case 'all': startDate = new Date('2024-01-01'); break
    default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  const startDateStr = startDate.toISOString().split('T')[0]

  try {
    // Run all queries in parallel
    const [
      usersInRange,
      messagesInRange,
      paymentsInRange,
      usageInRange,
      totalUsersResult,
      activeSubsResult,
      cancelledSubsResult,
    ] = await Promise.all([
      supabase.from('user_profiles').select('created_at')
        .gte('created_at', startDateStr),
      supabase.from('messages').select('created_at')
        .gte('created_at', `${startDateStr}T00:00:00`)
        .limit(10000),
      supabase.from('payment_history').select('created_at, amount, status')
        .gte('created_at', `${startDateStr}T00:00:00`)
        .eq('status', 'completed'),
      supabase.from('usage_records').select('model_id, tokens_input, tokens_output, date, user_id')
        .gte('date', startDateStr),
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('plan_id')
        .eq('status', 'active')
        .neq('plan_id', 'free'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled'),
    ])

    // Build date array for the range
    const dates: string[] = []
    const d = new Date(startDate)
    while (d <= now) {
      dates.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }

    // --- User Growth ---
    const usersByDate = new Map<string, number>()
    usersInRange.data?.forEach(u => {
      const date = new Date(u.created_at).toISOString().split('T')[0]
      usersByDate.set(date, (usersByDate.get(date) || 0) + 1)
    })

    let cumulativeUsers = (totalUsersResult.count || 0) - (usersInRange.data?.length || 0)
    const userGrowth = dates.map(date => {
      const newUsers = usersByDate.get(date) || 0
      cumulativeUsers += newUsers
      return { date, count: cumulativeUsers, new_users: newUsers }
    })

    // --- Message Stats ---
    const msgsByDate = new Map<string, number>()
    messagesInRange.data?.forEach(m => {
      const date = new Date(m.created_at).toISOString().split('T')[0]
      msgsByDate.set(date, (msgsByDate.get(date) || 0) + 1)
    })

    // Token stats from usage_records
    const tokensByDate = new Map<string, number>()
    usageInRange.data?.forEach(u => {
      const existing = tokensByDate.get(u.date) || 0
      tokensByDate.set(u.date, existing + (u.tokens_input || 0) + (u.tokens_output || 0))
    })

    const messageStats = dates.map(date => ({
      date,
      count: msgsByDate.get(date) || 0,
      tokens: tokensByDate.get(date) || 0,
    }))

    // --- Revenue Stats ---
    const revByDate = new Map<string, { amount: number; count: number }>()
    paymentsInRange.data?.forEach(p => {
      const date = new Date(p.created_at).toISOString().split('T')[0]
      const existing = revByDate.get(date) || { amount: 0, count: 0 }
      revByDate.set(date, {
        amount: existing.amount + (p.amount || 0),
        count: existing.count + 1,
      })
    })
    const revenueStats = dates.map(date => ({
      date,
      amount: revByDate.get(date)?.amount || 0,
      subscriptions: revByDate.get(date)?.count || 0,
    }))

    // --- Model Usage ---
    const modelMap = new Map<string, { requests: number; tokens: number }>()
    usageInRange.data?.forEach(u => {
      const existing = modelMap.get(u.model_id) || { requests: 0, tokens: 0 }
      modelMap.set(u.model_id, {
        requests: existing.requests + 1,
        tokens: existing.tokens + (u.tokens_input || 0) + (u.tokens_output || 0),
      })
    })

    const totalRequests = Array.from(modelMap.values()).reduce((sum, v) => sum + v.requests, 0)
    const modelUsage = Array.from(modelMap.entries())
      .map(([model, stats]) => ({
        model,
        requests: stats.requests,
        tokens: stats.tokens,
        percentage: totalRequests > 0 ? Math.round((stats.requests / totalRequests) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)

    // --- Top Users (by usage) ---
    const userUsageMap = new Map<string, number>()
    usageInRange.data?.forEach(u => {
      userUsageMap.set(u.user_id, (userUsageMap.get(u.user_id) || 0) + 1)
    })

    const topUserIds = Array.from(userUsageMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Fetch profiles for top users
    const topUsers = []
    if (topUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', topUserIds.map(([id]) => id))

      for (const [userId, msgCount] of topUserIds) {
        const profile = profiles?.find(p => p.user_id === userId)
        topUsers.push({
          user_id: userId.substring(0, 8),
          name: profile?.display_name || 'ผู้ใช้',
          messages: msgCount,
          spent: 0,
        })
      }
    }

    // --- Metrics ---
    const totalUsers = totalUsersResult.count || 0
    const activeSubs = activeSubsResult.data?.length || 0
    const cancelledSubs = cancelledSubsResult.count || 0
    const conversionRate = totalUsers > 0
      ? Math.round((activeSubs / totalUsers) * 1000) / 10
      : 0
    const churnRate = (activeSubs + cancelledSubs) > 0
      ? Math.round((cancelledSubs / (activeSubs + cancelledSubs)) * 1000) / 10
      : 0

    // --- Daily Active Users (last 7 days from usage_records) ---
    const dauMap = new Map<string, Set<string>>()
    usageInRange.data?.forEach(u => {
      if (!dauMap.has(u.date)) dauMap.set(u.date, new Set())
      dauMap.get(u.date)!.add(u.user_id)
    })

    const dailyActiveUsers: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      dailyActiveUsers.push(dauMap.get(dayStr)?.size || 0)
    }

    return NextResponse.json({
      userGrowth,
      messageStats,
      revenueStats,
      modelUsage,
      topUsers,
      conversionRate,
      churnRate,
      avgSessionDuration: 0,
      dailyActiveUsers,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
