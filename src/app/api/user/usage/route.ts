import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserPlan, PLAN_LIMITS } from '@/lib/plan-limits'
import { NextResponse } from 'next/server'

const PLAN_NAMES: Record<string, string> = {
  free: 'ฟรี',
  starter: 'เริ่มต้น',
  pro: 'โปร',
  premium: 'พรีเมียม',
}

export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Check if user is admin
  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  const isAdmin = !!adminRow

  // Admin plan simulation: ?simulate=free|starter|pro|premium
  const url = new URL(request.url)
  const simulateParam = url.searchParams.get('simulate')
  const validPlans = ['free', 'starter', 'pro', 'premium'] as const
  const isSimulating = isAdmin && simulateParam && validPlans.includes(simulateParam as typeof validPlans[number])

  // Get user's plan (or simulated plan)
  const userPlan = isSimulating
    ? { planId: simulateParam as typeof validPlans[number] }
    : await getUserPlan(user.id)
  const limits = PLAN_LIMITS[userPlan.planId]

  // Get monthly data with date for daily breakdown
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]

  const { data: monthlyData } = await supabase
    .from('daily_usage')
    .select('date, cost_thb, messages_count, images_count, videos_count, searches_count')
    .eq('user_id', user.id)
    .gte('date', monthStart)
    .order('date', { ascending: false })

  // Monthly totals
  const usedThb = monthlyData?.reduce((sum, r) => sum + (Number(r.cost_thb) || 0), 0) || 0
  const messagesUsed = monthlyData?.reduce((sum, r) => sum + (r.messages_count || 0), 0) || 0
  const imagesUsed = monthlyData?.reduce((sum, r) => sum + (r.images_count || 0), 0) || 0
  const videosUsed = monthlyData?.reduce((sum, r) => sum + (r.videos_count || 0), 0) || 0
  const searchesUsed = monthlyData?.reduce((sum, r) => sum + (r.searches_count || 0), 0) || 0

  // Today's totals
  const todayData = monthlyData?.filter(r => r.date === todayStr) || []
  const todayMessages = todayData.reduce((sum, r) => sum + (r.messages_count || 0), 0)
  const todayImages = todayData.reduce((sum, r) => sum + (r.images_count || 0), 0)
  const todayVideos = todayData.reduce((sum, r) => sum + (r.videos_count || 0), 0)
  const todaySearches = todayData.reduce((sum, r) => sum + (r.searches_count || 0), 0)
  const todayCost = todayData.reduce((sum, r) => sum + (Number(r.cost_thb) || 0), 0)

  // Daily budget allocation
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dailyBudget = limits.monthlyBudgetThb > 0 ? limits.monthlyBudgetThb / daysInMonth : 0
  const dayOfMonth = now.getDate()
  const budgetSoFar = dailyBudget * dayOfMonth // budget that should have been used by now

  // Active days (days with any activity)
  const activeDays = monthlyData?.length || 0

  // Daily breakdown (last 7 days)
  const dailyBreakdown = (monthlyData || []).slice(0, 7).map(r => ({
    date: r.date,
    messages: r.messages_count || 0,
    images: r.images_count || 0,
    videos: r.videos_count || 0,
    searches: r.searches_count || 0,
    cost: Number(r.cost_thb) || 0,
  }))

  return NextResponse.json({
    plan: userPlan.planId,
    planName: isSimulating ? (PLAN_NAMES[userPlan.planId] || 'ฟรี') : (isAdmin ? 'แอดมิน' : (PLAN_NAMES[userPlan.planId] || 'ฟรี')),
    simulating: isSimulating ? userPlan.planId : undefined,
    budget: {
      limit: limits.monthlyBudgetThb,
      used: usedThb,
      remaining: Math.max(0, limits.monthlyBudgetThb - usedThb),
      percent: limits.monthlyBudgetThb > 0 ? Math.min(100, Math.round((usedThb / limits.monthlyBudgetThb) * 100)) : 0,
      unlimited: isSimulating ? false : (isAdmin || limits.monthlyBudgetThb === 0),
      dailyBudget,
      budgetPace: budgetSoFar > 0 ? Math.round((usedThb / budgetSoFar) * 100) : 0,
    },
    today: {
      messages: todayMessages,
      images: todayImages,
      videos: todayVideos,
      searches: todaySearches,
      cost: todayCost,
    },
    counts: {
      messages: messagesUsed,
      images: imagesUsed,
      videos: videosUsed,
      searches: searchesUsed,
    },
    activeDays,
    dailyBreakdown,
  })
}
