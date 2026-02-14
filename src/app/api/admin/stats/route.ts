import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/admin/stats - Dashboard stats (total users, revenue, active subs, messages today)
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
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const planPrices: Record<string, number> = {
      free: 0,
      starter: 199,
      pro: 499,
      premium: 799,
    }

    // Run queries in parallel
    const [
      usersResult,
      activeSubsResult,
      messagesTodayResult,
      revenueResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),

      // Active subscriptions
      supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('status', 'active'),

      // Messages today
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),

      // Total revenue from payment history
      supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'completed'),
    ])

    const totalUsers = usersResult.count || 0

    // Calculate MRR from active subscriptions
    const activeSubs = activeSubsResult.data || []
    const activeSubscriptions = activeSubs.length
    const mrr = activeSubs.reduce((sum, sub) => {
      return sum + (planPrices[sub.plan_id] || 0)
    }, 0)

    const messagesToday = messagesTodayResult.count || 0
    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Plan breakdown
    const planBreakdown: Record<string, number> = {}
    activeSubs.forEach(sub => {
      planBreakdown[sub.plan_id] = (planBreakdown[sub.plan_id] || 0) + 1
    })

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      messagesToday,
      mrr,
      totalRevenue,
      planBreakdown,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
