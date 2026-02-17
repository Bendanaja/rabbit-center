import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/costs - Get internal cost analytics (owner/admin only)
export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Check admin role from admin_users table (not user_profiles)
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminData || !['owner', 'admin'].includes(adminData.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month' // 'day', 'week', 'month'

  // Calculate date range
  const now = new Date()
  let startDate: string
  switch (period) {
    case 'day':
      startDate = now.toISOString().split('T')[0]
      break
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      startDate = weekAgo.toISOString().split('T')[0]
      break
    }
    default: {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = monthAgo.toISOString().split('T')[0]
    }
  }

  try {
    // Get cost summary by action type
    const { data: costByAction } = await supabase
      .from('usage_cost_log')
      .select('action, estimated_cost_thb, estimated_cost_usd')
      .gte('created_at', startDate)

    // Aggregate manually (Supabase doesn't support GROUP BY in select)
    const summary: Record<string, { count: number; totalCostTHB: number; totalCostUSD: number }> = {}
    for (const row of costByAction || []) {
      if (!summary[row.action]) {
        summary[row.action] = { count: 0, totalCostTHB: 0, totalCostUSD: 0 }
      }
      summary[row.action].count++
      summary[row.action].totalCostTHB += Number(row.estimated_cost_thb)
      summary[row.action].totalCostUSD += Number(row.estimated_cost_usd)
    }

    // Get top 10 most expensive users this period
    const { data: allCosts } = await supabase
      .from('usage_cost_log')
      .select('user_id, estimated_cost_thb')
      .gte('created_at', startDate)

    const userCosts: Record<string, number> = {}
    for (const row of allCosts || []) {
      userCosts[row.user_id] = (userCosts[row.user_id] || 0) + Number(row.estimated_cost_thb)
    }

    const topUsers = Object.entries(userCosts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, totalCostTHB]) => ({ userId, totalCostTHB: Math.round(totalCostTHB * 100) / 100 }))

    // Get total revenue this period (from subscriptions)
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active')

    const planPrices: Record<string, number> = { free: 0, starter: 199, pro: 499, premium: 799 }
    const monthlyRevenue = (subs || []).reduce((sum, s) => sum + (planPrices[s.plan_id] || 0), 0)

    const totalCostTHB = Object.values(summary).reduce((sum, s) => sum + s.totalCostTHB, 0)
    const totalRequests = Object.values(summary).reduce((sum, s) => sum + s.count, 0)

    return NextResponse.json({
      period,
      startDate,
      summary,
      totalCostTHB: Math.round(totalCostTHB * 100) / 100,
      totalCostUSD: Math.round(totalCostTHB / 34 * 100) / 100,
      totalRequests,
      estimatedMonthlyRevenue: monthlyRevenue,
      estimatedMarginPercent: monthlyRevenue > 0
        ? Math.round((1 - totalCostTHB / monthlyRevenue) * 100)
        : 0,
      topUsers,
    })
  } catch (error) {
    console.error('Costs error:', error)
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 })
  }
}
