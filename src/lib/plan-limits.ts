import { createAdminClient } from '@/lib/supabase/admin'
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis'
import { getModelKey } from '@/lib/byteplus'

// Plan IDs matching PRICING_PLANS in constants.ts
export type PlanId = 'free' | 'starter' | 'pro' | 'premium'

export type PlanAction = 'chat' | 'image' | 'video' | 'search'

export interface PlanLimits {
  monthlyBudgetThb: number     // Monthly budget in THB (0 = unlimited)
  allowedModels: string[]      // empty = all models
  allowedImageModels: string[] // empty = all image models
  allowedVideoModels: string[] // empty = all video models
  canGenerateImages: boolean   // false = blocked entirely (Free plan)
  canGenerateVideos: boolean   // false = blocked entirely (Free plan)
  chatHistoryDays: number      // 0 = unlimited
  hasApiAccess: boolean
  hasPrioritySpeed: boolean
}

// Economy-tier models (cheapest to operate)
const FREE_MODELS = ['seed-1-6-flash', 'gpt-oss-120b']
const STARTER_MODELS = ['seed-1-6-flash', 'gpt-oss-120b', 'deepseek-v3-2', 'glm-4', 'nano-banana']
// Pro gets all BytePlus + nano-banana-pro + gpt-5-2 (NOT grok-4 or claude-4-6)
const PRO_MODELS = [
  'seed-1-6-flash', 'gpt-oss-120b', 'deepseek-v3-2', 'glm-4', 'nano-banana',
  'deepseek-r1', 'deepseek-v3-1', 'seed-1-8', 'seed-1-6', 'kimi-k2-thinking', 'kimi-k2',
  'nano-banana-pro', 'gpt-5-2'
]
// Premium: [] (all models including grok-4, claude-4-6)
const STARTER_IMAGE_MODELS = ['seedream-3', 'seedream-4'] // exclude 4.5 (most expensive)
const STARTER_VIDEO_MODELS = ['seedance-lite-t2v', 'seedance-lite-i2v', 'seedance-pro-fast'] // cheap video models only

/**
 * Plan limits with monthly budget system.
 * Budget = 50% of plan price, guaranteeing 50%+ margin.
 *
 * Budget per plan:
 *   Free:    ฿5/month (acquisition cost)
 *   Starter: ฿100/month (฿199 revenue → 50% margin)
 *   Pro:     ฿250/month (฿499 revenue → 50% margin)
 *   Premium: ฿400/month (฿799 revenue → 50% margin)
 *
 * Model tier restrictions still apply — Free users can't use Claude 4.6 etc.
 * Free users can't generate images/videos regardless of budget.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyBudgetThb: 5,
    allowedModels: FREE_MODELS,
    allowedImageModels: [],
    allowedVideoModels: [],
    canGenerateImages: false,
    canGenerateVideos: false,
    chatHistoryDays: 7,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  starter: {
    monthlyBudgetThb: 100,
    allowedModels: STARTER_MODELS,
    allowedImageModels: STARTER_IMAGE_MODELS,
    allowedVideoModels: STARTER_VIDEO_MODELS,
    canGenerateImages: true,
    canGenerateVideos: true,
    chatHistoryDays: 30,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  pro: {
    monthlyBudgetThb: 250,
    allowedModels: PRO_MODELS,
    allowedImageModels: [], // all image models
    allowedVideoModels: [], // all video models
    canGenerateImages: true,
    canGenerateVideos: true,
    chatHistoryDays: 0, // unlimited
    hasApiAccess: false,
    hasPrioritySpeed: true,
  },
  premium: {
    monthlyBudgetThb: 400,
    allowedModels: [], // all models (including grok-4, claude-4-6)
    allowedImageModels: [],
    allowedVideoModels: [],
    canGenerateImages: true,
    canGenerateVideos: true,
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
  planId: PlanId
  budgetUsed?: number   // THB used this month
  budgetLimit?: number  // THB monthly budget
}

/**
 * Get total cost_thb for a user in the current month.
 */
async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = createAdminClient()
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  const monthStart = firstOfMonth.toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_usage')
    .select('cost_thb')
    .eq('user_id', userId)
    .gte('date', monthStart)

  return data?.reduce((sum, row) => sum + (Number(row.cost_thb) || 0), 0) || 0
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
 * Increment daily usage count and cost for a user action.
 * Uses the upsert_daily_usage RPC function for atomic upserts.
 */
export async function incrementUsage(
  userId: string,
  action: PlanAction,
  costThb: number = 0
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('upsert_daily_usage', {
    p_user_id: userId,
    p_messages: action === 'chat' ? 1 : 0,
    p_images: action === 'image' ? 1 : 0,
    p_videos: action === 'video' ? 1 : 0,
    p_searches: action === 'search' ? 1 : 0,
    p_cost_thb: costThb,
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
  modelKey?: string,
  estimatedCostThb?: number
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

  // Check image access - blocked entirely for plans without image capability
  if (action === 'image' && !limits.canGenerateImages) {
    return {
      allowed: false,
      reason: 'แพลนของคุณไม่รองรับการสร้างรูปภาพ กรุณาอัปเกรดเพื่อใช้งาน',
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

  // Check video access - blocked entirely for plans without video capability
  if (action === 'video' && !limits.canGenerateVideos) {
    return {
      allowed: false,
      reason: 'แพลนของคุณไม่รองรับการสร้างวิดีโอ กรุณาอัปเกรดเพื่อใช้งาน',
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

  // Search is unlimited (self-hosted SearXNG, no cost)
  if (action === 'search') {
    return { allowed: true, planId: userPlan.planId }
  }

  // Budget check
  if (limits.monthlyBudgetThb > 0) {
    const usedThb = await getMonthlyUsage(userId)
    const costEstimate = estimatedCostThb || 0.01 // fallback tiny amount

    if (usedThb + costEstimate > limits.monthlyBudgetThb) {
      return {
        allowed: false,
        reason: `วงเงินประจำเดือนหมดแล้ว (${usedThb.toFixed(2)}/${limits.monthlyBudgetThb} บาท) กรุณาอัปเกรดแพลนหรือรอเดือนหน้า`,
        planId: userPlan.planId,
        budgetUsed: usedThb,
        budgetLimit: limits.monthlyBudgetThb,
      }
    }
  }

  return { allowed: true, planId: userPlan.planId }
}
