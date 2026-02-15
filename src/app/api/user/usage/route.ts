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

  // Get user's plan
  const userPlan = await getUserPlan(user.id)
  const limits = PLAN_LIMITS[userPlan.planId]

  // Get monthly cost total
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]

  const { data: monthlyData } = await supabase
    .from('daily_usage')
    .select('cost_thb, messages_count, images_count, videos_count, searches_count')
    .eq('user_id', user.id)
    .gte('date', monthStart)

  const usedThb = monthlyData?.reduce((sum, r) => sum + (Number(r.cost_thb) || 0), 0) || 0
  const messagesUsed = monthlyData?.reduce((sum, r) => sum + (r.messages_count || 0), 0) || 0
  const imagesUsed = monthlyData?.reduce((sum, r) => sum + (r.images_count || 0), 0) || 0
  const videosUsed = monthlyData?.reduce((sum, r) => sum + (r.videos_count || 0), 0) || 0
  const searchesUsed = monthlyData?.reduce((sum, r) => sum + (r.searches_count || 0), 0) || 0

  return NextResponse.json({
    plan: userPlan.planId,
    planName: PLAN_NAMES[userPlan.planId] || 'ฟรี',
    budget: {
      limit: limits.monthlyBudgetThb,
      used: usedThb,
      remaining: Math.max(0, limits.monthlyBudgetThb - usedThb),
      percent: limits.monthlyBudgetThb > 0 ? Math.min(100, Math.round((usedThb / limits.monthlyBudgetThb) * 100)) : 0,
      unlimited: limits.monthlyBudgetThb === 0,
    },
    counts: {
      messages: messagesUsed,
      images: imagesUsed,
      videos: videosUsed,
      searches: searchesUsed,
    },
  })
}
