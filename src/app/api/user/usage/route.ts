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
  const today = new Date().toISOString().split('T')[0]

  // Get user's plan
  const userPlan = await getUserPlan(user.id)
  const limits = PLAN_LIMITS[userPlan.planId]

  // Get today's usage from daily_usage table
  const { data: usageData } = await supabase
    .from('daily_usage')
    .select('messages_count, images_count, videos_count, searches_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  const messagesUsed = usageData?.messages_count || 0
  const imagesUsed = usageData?.images_count || 0
  const videosUsed = usageData?.videos_count || 0
  const searchesUsed = usageData?.searches_count || 0

  // Helper: 0 means unlimited in PLAN_LIMITS
  const calcRemaining = (used: number, limit: number) =>
    limit === 0 ? -1 : Math.max(0, limit - used)

  return NextResponse.json({
    plan: userPlan.planId,
    usage: {
      messages: {
        used: messagesUsed,
        limit: limits.messagesPerDay,
        remaining: calcRemaining(messagesUsed, limits.messagesPerDay),
        unlimited: limits.messagesPerDay === 0,
      },
      images: {
        used: imagesUsed,
        limit: limits.imagesPerDay,
        remaining: calcRemaining(imagesUsed, limits.imagesPerDay),
        unlimited: limits.imagesPerDay === 0,
      },
      videos: {
        used: videosUsed,
        limit: limits.videosPerDay,
        remaining: calcRemaining(videosUsed, limits.videosPerDay),
        unlimited: limits.videosPerDay === 0,
      },
      searches: {
        used: searchesUsed,
        limit: limits.searchesPerDay,
        remaining: calcRemaining(searchesUsed, limits.searchesPerDay),
        unlimited: limits.searchesPerDay === 0,
      },
    },
    planName: PLAN_NAMES[userPlan.planId] || 'ฟรี',
  })
}
