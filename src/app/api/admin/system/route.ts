import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'

export const dynamic = 'force-dynamic'

// GET /api/admin/system - System health with real DB stats
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

  const startTime = Date.now()

  try {
    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Run all queries in parallel for speed
    const [
      usersResult,
      chatsResult,
      messagesResult,
      messagesTodayResult,
      imagesResult,
      videosResult,
      subsResult,
      modelsResult,
      usageTodayResult,
      usageWeekResult,
      costResult,
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('chats').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`),
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .eq('role', 'assistant')
        .not('image_url', 'is', null),
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .eq('role', 'assistant')
        .not('video_url', 'is', null),
      supabase.from('subscriptions').select('plan_id, status'),
      supabase.from('ai_models').select('id, name, is_active'),
      supabase.from('usage_records').select('*', { count: 'exact', head: true })
        .gte('date', today),
      supabase.from('usage_records').select('*', { count: 'exact', head: true })
        .gte('date', weekAgo),
      supabase.from('usage_cost_log').select('estimated_cost_thb, action')
        .gte('created_at', `${today}T00:00:00`),
    ])

    const dbLatency = Date.now() - startTime

    // Calculate active subscriptions
    const activeSubs = subsResult.data?.filter(s => s.status === 'active') || []
    const planBreakdown: Record<string, number> = {}
    activeSubs.forEach(sub => {
      planBreakdown[sub.plan_id] = (planBreakdown[sub.plan_id] || 0) + 1
    })

    // Calculate cost breakdown today
    const costBreakdown: Record<string, { count: number; cost: number }> = {}
    let totalCostToday = 0
    for (const row of costResult.data || []) {
      if (!costBreakdown[row.action]) {
        costBreakdown[row.action] = { count: 0, cost: 0 }
      }
      costBreakdown[row.action].count++
      costBreakdown[row.action].cost += Number(row.estimated_cost_thb)
      totalCostToday += Number(row.estimated_cost_thb)
    }

    // Active models
    const activeModels = modelsResult.data?.filter(m => m.is_active) || []
    const totalModels = modelsResult.data?.length || 0

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      dbLatencyMs: dbLatency,

      // Database stats
      database: {
        totalUsers: usersResult.count || 0,
        totalChats: chatsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        messagesToday: messagesTodayResult.count || 0,
        totalImages: imagesResult.count || 0,
        totalVideos: videosResult.count || 0,
      },

      // Subscriptions
      subscriptions: {
        active: activeSubs.length,
        planBreakdown,
      },

      // AI Models
      models: {
        total: totalModels,
        active: activeModels.length,
        names: activeModels.map(m => m.name),
      },

      // Usage
      usage: {
        requestsToday: usageTodayResult.count || 0,
        requestsWeek: usageWeekResult.count || 0,
      },

      // Costs
      costs: {
        totalToday: Math.round(totalCostToday * 100) / 100,
        breakdown: costBreakdown,
      },
    })
  } catch (error) {
    console.error('System health error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system health', dbLatencyMs: Date.now() - startTime },
      { status: 500 }
    )
  }
}
