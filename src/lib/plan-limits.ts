import { createAdminClient } from '@/lib/supabase/admin'
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis'
import { getModelKey } from '@/lib/byteplus'

// Plan IDs matching PRICING_PLANS in constants.ts
export type PlanId = 'free' | 'starter' | 'pro' | 'premium'

export type PlanAction = 'chat' | 'image' | 'video'

export interface PlanLimits {
  messagesPerDay: number       // 0 = unlimited
  imagesPerDay: number         // 0 = unlimited
  videosPerDay: number         // 0 = unlimited
  allowedModels: string[]      // empty = all models
  allowedImageModels: string[] // empty = all image models
  allowedVideoModels: string[] // empty = all video models
  chatHistoryDays: number      // 0 = unlimited
  hasApiAccess: boolean
  hasPrioritySpeed: boolean
}

// Economy-tier models (cheapest to operate)
const FREE_MODELS = ['seed-1-6-flash']
const STARTER_MODELS = ['seed-1-6-flash', 'deepseek-v3-2', 'glm-4']
const STARTER_IMAGE_MODELS = ['seedream-3', 'seedream-4'] // exclude 4.5 (most expensive)
const STARTER_VIDEO_MODELS = ['seedance-lite-t2v', 'seedance-lite-i2v', 'seedance-pro-fast'] // cheap video models only

/**
 * Plan limits calibrated against actual BytePlus API costs (with 40% discount)
 * to ensure profitability at all usage levels.
 *
 * Cost analysis (max usage per month, 30 days):
 *
 * Free:    30×30×฿0.009 = ฿8.1 cost, ฿0 revenue (acquisition cost)
 * Starter: 100×30×฿0.012 + 3×30×฿0.61 + 1×30×฿0.75 = ฿36+฿54.9+฿22.5 = ฿113.4 cost, ฿199 revenue (43% margin at max)
 * Pro:     200×30×฿0.03 + 8×30×฿0.82 + 2×30×฿1.35 = ฿180+฿196.8+฿81 = ฿458 cost, ฿499 revenue (8% margin at max)
 * Premium: 400×30×฿0.035 + 10×30×฿0.82 + 3×30×฿1.35 = ฿420+฿246+฿121.5 = ฿788 cost, ฿799 revenue (1.4% margin at max)
 *
 * At typical 30% utilization: ~70% margins across all paid plans.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    messagesPerDay: 30,
    imagesPerDay: 0,
    videosPerDay: 0,
    allowedModels: FREE_MODELS,
    allowedImageModels: [],
    allowedVideoModels: [],
    chatHistoryDays: 7,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  starter: {
    messagesPerDay: 100,
    imagesPerDay: 3,
    videosPerDay: 1,
    allowedModels: STARTER_MODELS,
    allowedImageModels: STARTER_IMAGE_MODELS,
    allowedVideoModels: STARTER_VIDEO_MODELS,
    chatHistoryDays: 30,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  pro: {
    messagesPerDay: 200,
    imagesPerDay: 8,
    videosPerDay: 2,
    allowedModels: [], // all models
    allowedImageModels: [], // all image models
    allowedVideoModels: [], // all video models
    chatHistoryDays: 0, // unlimited
    hasApiAccess: false,
    hasPrioritySpeed: true,
  },
  premium: {
    messagesPerDay: 400,
    imagesPerDay: 10,
    videosPerDay: 3,
    allowedModels: [], // all models
    allowedImageModels: [], // all image models
    allowedVideoModels: [], // all video models
    chatHistoryDays: 0, // unlimited
    hasApiAccess: true,
    hasPrioritySpeed: true,
  },
}

export interface UserPlan {
  planId: PlanId
  status: 'active' | 'expired' | 'cancelled' | 'none'
  expiresAt: string | null
}

/**
 * Get the active plan for a user by querying the subscriptions table.
 * If no active subscription found, returns 'free'.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  // Try Redis cache first
  const cacheKey = `plan:${userId}`
  const cached = await cacheGet<UserPlan>(cacheKey)
  if (cached) return cached

  const supabase = createAdminClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, status, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    const result: UserPlan = { planId: 'free', status: 'none', expiresAt: null }
    await cacheSet(cacheKey, result, 300)
    return result
  }

  // Check if subscription has expired
  const expiresAt = subscription.current_period_end
  if (expiresAt && new Date(expiresAt) < new Date()) {
    const result: UserPlan = { planId: 'free', status: 'expired', expiresAt }
    await cacheSet(cacheKey, result, 300)
    return result
  }

  const planId = subscription.plan_id as PlanId
  // Validate plan_id is a known plan
  if (!PLAN_LIMITS[planId]) {
    const result: UserPlan = { planId: 'free', status: 'none', expiresAt: null }
    await cacheSet(cacheKey, result, 300)
    return result
  }

  const result: UserPlan = {
    planId,
    status: subscription.status as UserPlan['status'],
    expiresAt,
  }
  await cacheSet(cacheKey, result, 300)
  return result
}

/**
 * Invalidate the cached plan for a user.
 * Call this when a subscription changes (purchase, cancel, etc.)
 */
export async function invalidateUserPlanCache(userId: string): Promise<void> {
  await cacheDel(`plan:${userId}`)
}

export interface PlanCheckResult {
  allowed: boolean
  reason?: string
  limit?: number
  used?: number
  planId: PlanId
}

/**
 * Count how many times a user has performed an action today.
 * Uses the daily_usage table.
 */
async function getDailyUsage(userId: string, action: PlanAction): Promise<number> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_usage')
    .select('messages_count, images_count, videos_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (!data) return 0

  switch (action) {
    case 'chat': return data.messages_count || 0
    case 'image': return data.images_count || 0
    case 'video': return data.videos_count || 0
  }
}

/**
 * Log the estimated cost of an API call for internal tracking.
 * This data is NEVER shown to customers.
 */
export async function logUsageCost(
  userId: string,
  action: PlanAction,
  modelKey: string,
  costUsd: number,
  inputTokens?: number,
  outputTokens?: number,
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('usage_cost_log').insert({
      user_id: userId,
      action,
      model_key: modelKey,
      input_tokens: inputTokens || 0,
      output_tokens: outputTokens || 0,
      estimated_cost_usd: costUsd,
      estimated_cost_thb: costUsd * 34, // USD to THB
    })
  } catch (err) {
    // Non-critical: don't block the request if logging fails
    console.warn('Failed to log usage cost:', err)
  }
}

/**
 * Increment daily usage count for a user action.
 * Uses the upsert_daily_usage RPC function for atomic upserts.
 */
export async function incrementUsage(userId: string, action: PlanAction): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('upsert_daily_usage', {
    p_user_id: userId,
    p_messages: action === 'chat' ? 1 : 0,
    p_images: action === 'image' ? 1 : 0,
    p_videos: action === 'video' ? 1 : 0,
  })

  if (error) {
    console.error('incrementUsage RPC failed:', error.message, { userId, action })
  }
}

/**
 * Check if a user is an active admin (owner/admin/moderator).
 * Admins bypass all plan limits.
 */
async function isAdminUser(userId: string): Promise<boolean> {
  const cacheKey = `is_admin:${userId}`
  const cached = await cacheGet<boolean>(cacheKey)
  if (cached !== null) return cached

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single()

  const result = !!data
  await cacheSet(cacheKey, result, 300) // cache 5 min
  return result
}

/**
 * Check if a model is active (not disabled by admin).
 * Returns true if the model is active or not found in DB (defaults to active).
 */
async function isModelActive(modelKey: string): Promise<boolean> {
  const cacheKey = `model_active:${modelKey}`
  const cached = await cacheGet<boolean>(cacheKey)
  if (cached !== null) return cached

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('ai_models')
    .select('is_active')
    .eq('model_id', modelKey)
    .single()

  // If not in DB, default to active (follows hardcoded MODELS list)
  const isActive = data ? data.is_active !== false : true
  await cacheSet(cacheKey, isActive, 60) // cache 1 min
  return isActive
}

/**
 * Check whether a user is allowed to perform an action based on their plan.
 * Admin users bypass all limits.
 * Returns allowed/denied with reason.
 */
export async function checkPlanLimit(
  userId: string,
  action: PlanAction,
  modelKey?: string
): Promise<PlanCheckResult> {
  // Admin bypass: admins get unlimited access to everything
  if (await isAdminUser(userId)) {
    return { allowed: true, planId: 'premium' }
  }

  const userPlan = await getUserPlan(userId)
  const limits = PLAN_LIMITS[userPlan.planId]

  // Resolve full model ID (e.g. 'deepseek-v3-2-251201') to short key (e.g. 'deepseek-v3-2')
  // The allowedModels lists use short keys, but the API receives full IDs
  const resolvedModelKey = modelKey ? (getModelKey(modelKey) || modelKey) : undefined

  // Check if model is disabled by admin
  if (resolvedModelKey) {
    const active = await isModelActive(resolvedModelKey)
    if (!active) {
      return {
        allowed: false,
        reason: 'โมเดลนี้ถูกปิดใช้งานชั่วคราว กรุณาเลือกโมเดลอื่น',
        planId: userPlan.planId,
      }
    }
  }

  // Check model access for chat actions
  if (action === 'chat' && resolvedModelKey && limits.allowedModels.length > 0) {
    if (!limits.allowedModels.includes(resolvedModelKey)) {
      return {
        allowed: false,
        reason: `โมเดลนี้ต้องใช้แพลนที่สูงกว่า กรุณาอัปเกรดเพื่อใช้งานโมเดลนี้`,
        planId: userPlan.planId,
      }
    }
  }

  // Check image access - denied if daily limit is 0
  if (action === 'image' && limits.imagesPerDay === 0) {
    return {
      allowed: false,
      reason: 'แพลนของคุณไม่รองรับการสร้างรูปภาพ กรุณาอัปเกรดเพื่อใช้งาน',
      limit: 0,
      used: 0,
      planId: userPlan.planId,
    }
  }

  // Check image model access (some plans restrict to cheaper models)
  if (action === 'image' && resolvedModelKey && limits.allowedImageModels.length > 0) {
    if (!limits.allowedImageModels.includes(resolvedModelKey)) {
      return {
        allowed: false,
        reason: 'โมเดลสร้างรูปนี้ต้องใช้แพลนที่สูงกว่า กรุณาอัปเกรดเพื่อใช้งาน',
        planId: userPlan.planId,
      }
    }
  }

  // Check video access - denied if daily limit is 0
  if (action === 'video' && limits.videosPerDay === 0) {
    return {
      allowed: false,
      reason: 'แพลนของคุณไม่รองรับการสร้างวิดีโอ กรุณาอัปเกรดเพื่อใช้งาน',
      limit: 0,
      used: 0,
      planId: userPlan.planId,
    }
  }

  // Check video model access
  if (action === 'video' && resolvedModelKey && limits.allowedVideoModels.length > 0) {
    if (!limits.allowedVideoModels.includes(resolvedModelKey)) {
      return {
        allowed: false,
        reason: 'โมเดลสร้างวิดีโอนี้ต้องใช้แพลนที่สูงกว่า กรุณาอัปเกรดเพื่อใช้งาน',
        planId: userPlan.planId,
      }
    }
  }

  // Determine the daily limit for this action
  let dailyLimit: number
  switch (action) {
    case 'chat':
      dailyLimit = limits.messagesPerDay
      break
    case 'image':
      dailyLimit = limits.imagesPerDay
      break
    case 'video':
      dailyLimit = limits.videosPerDay
      break
  }

  // 0 means unlimited
  if (dailyLimit === 0) {
    return { allowed: true, planId: userPlan.planId }
  }

  // Check daily usage
  const used = await getDailyUsage(userId, action)

  if (used >= dailyLimit) {
    return {
      allowed: false,
      reason: `คุณใช้งาน${action === 'chat' ? 'ข้อความ' : action === 'image' ? 'สร้างรูป' : 'สร้างวิดีโอ'}ครบ ${dailyLimit} ครั้งต่อวันแล้ว กรุณาอัปเกรดแพลนหรือรอพรุ่งนี้`,
      limit: dailyLimit,
      used,
      planId: userPlan.planId,
    }
  }

  return {
    allowed: true,
    limit: dailyLimit,
    used,
    planId: userPlan.planId,
  }
}
