import { createAdminClient } from '@/lib/supabase/admin'
import { cacheGet, cacheSet, cacheDel, redisIncrByFloat } from '@/lib/redis'
import { getModelKey } from '@/lib/byteplus'

// Plan IDs matching PRICING_PLANS in constants.ts
export type PlanId = 'free' | 'starter' | 'pro' | 'premium'

export type PlanAction = 'chat' | 'image' | 'video' | 'search'

/**
 * Plan tier hierarchy (lower index = lower tier).
 * A model with tier='starter' is accessible by starter, pro, and premium.
 */
const PLAN_HIERARCHY: PlanId[] = ['free', 'starter', 'pro', 'premium']

export function getPlanLevel(planId: PlanId): number {
  return PLAN_HIERARCHY.indexOf(planId)
}

export interface PlanLimits {
  monthlyBudgetThb: number     // Monthly budget in THB (0 = unlimited)
  canGenerateImages: boolean   // false = blocked entirely (Free plan)
  canGenerateVideos: boolean   // false = blocked entirely (Free plan)
  chatHistoryDays: number      // 0 = unlimited
  hasApiAccess: boolean
  hasPrioritySpeed: boolean
}

// Hardcoded fallback model lists (used if DB query fails)
const FALLBACK_FREE_MODELS = ['seed-1-6-flash', 'gpt-oss-120b']
const FALLBACK_STARTER_MODELS = ['seed-1-6-flash', 'gpt-oss-120b', 'deepseek-v3-2', 'glm-4', 'nano-banana']
const FALLBACK_PRO_MODELS = [
  'seed-1-6-flash', 'gpt-oss-120b', 'deepseek-v3-2', 'glm-4', 'nano-banana',
  'deepseek-r1', 'deepseek-v3-1', 'seed-1-8', 'seed-1-6', 'kimi-k2-thinking', 'kimi-k2',
  'nano-banana-pro', 'gpt-5-2'
]

/**
 * Plan limits with monthly budget system.
 * Budget = 50% of plan price, guaranteeing 50%+ margin.
 *
 * Budget per plan:
 *   Free:    ฿10/month (acquisition cost)
 *   Starter: ฿100/month (฿199 revenue → 50% margin)
 *   Pro:     ฿250/month (฿499 revenue → 50% margin)
 *   Premium: ฿400/month (฿799 revenue → 50% margin)
 *
 * Model access is now DYNAMIC — managed via ai_models.tier in DB.
 * The tier field on each model sets the MINIMUM plan required.
 * Free users can't generate images/videos regardless of budget.
 */
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyBudgetThb: 10,
    canGenerateImages: false,
    canGenerateVideos: false,
    chatHistoryDays: 7,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  starter: {
    monthlyBudgetThb: 100,
    canGenerateImages: true,
    canGenerateVideos: true,
    chatHistoryDays: 30,
    hasApiAccess: false,
    hasPrioritySpeed: false,
  },
  pro: {
    monthlyBudgetThb: 250,
    canGenerateImages: true,
    canGenerateVideos: true,
    chatHistoryDays: 0, // unlimited
    hasApiAccess: false,
    hasPrioritySpeed: true,
  },
  premium: {
    monthlyBudgetThb: 400,
    canGenerateImages: true,
    canGenerateVideos: true,
    chatHistoryDays: 0, // unlimited
    hasApiAccess: true,
    hasPrioritySpeed: true,
  },
}

/**
 * Get allowed model IDs for a plan by querying the DB.
 * Uses tier hierarchy: user can access models at their tier level or below.
 *   free → free only
 *   starter → free + starter
 *   pro → free + starter + pro
 *   premium → free + starter + pro + premium (all)
 * Returns empty array meaning all models allowed (for premium).
 */
export async function getAllowedModelsForPlan(
  planId: PlanId,
  modelType?: 'chat' | 'image' | 'video'
): Promise<string[]> {
  // Premium gets all models
  if (planId === 'premium') return []

  const cacheKey = `plan_models:${planId}:${modelType || 'all'}`
  const cached = await cacheGet<string[]>(cacheKey)
  if (cached) return cached

  try {
    const supabase = createAdminClient()
    const userLevel = getPlanLevel(planId)

    const { data } = await supabase
      .from('ai_models')
      .select('id, tier')
      .eq('is_active', true)

    if (!data || data.length === 0) {
      const fallback = getFallbackModels(planId, modelType)
      await cacheSet(cacheKey, fallback, 30)
      return fallback
    }

    // Filter models where model tier level <= user plan level
    const allowed = data
      .filter(m => getPlanLevel(normalizeTier(m.tier)) <= userLevel)
      .map(m => m.id)

    await cacheSet(cacheKey, allowed, 120) // cache 2 min
    return allowed
  } catch (err) {
    console.warn('Failed to fetch plan models from DB, using fallback:', err)
    return getFallbackModels(planId, modelType)
  }
}

/**
 * Normalize tier values from DB (handles legacy 'enterprise' → 'premium').
 */
function normalizeTier(tier: string): PlanId {
  if (tier === 'enterprise') return 'premium'
  if (PLAN_HIERARCHY.includes(tier as PlanId)) return tier as PlanId
  return 'pro' // default unknown tiers to pro
}

/**
 * Fallback hardcoded model lists when DB is unavailable.
 */
function getFallbackModels(planId: PlanId, modelType?: string): string[] {
  if (modelType === 'image') {
    if (planId === 'free') return []
    if (planId === 'starter') return ['seedream-3', 'seedream-4', 'flux-schnell']
    return [] // pro+ gets all
  }
  if (modelType === 'video') {
    if (planId === 'free') return []
    if (planId === 'starter') return ['seedance-lite-t2v', 'seedance-lite-i2v', 'seedance-pro-fast']
    return [] // pro+ gets all
  }
  // Chat models
  if (planId === 'free') return FALLBACK_FREE_MODELS
  if (planId === 'starter') return FALLBACK_STARTER_MODELS
  if (planId === 'pro') return FALLBACK_PRO_MODELS
  return [] // premium gets all
}

/**
 * Invalidate cached model access lists for all plans.
 * Call this when admin changes model tier settings.
 */
export async function invalidateModelAccessCache(): Promise<void> {
  const types = ['all', 'chat', 'image', 'video']
  const promises: Promise<void>[] = []
  for (const plan of PLAN_HIERARCHY) {
    for (const type of types) {
      promises.push(cacheDel(`plan_models:${plan}:${type}`))
    }
  }
  await Promise.all(promises)
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
    await cacheSet(cacheKey, result, 60)
    return result
  }

  // Check if subscription has expired
  const expiresAt = subscription.current_period_end
  if (expiresAt && new Date(expiresAt) < new Date()) {
    const result: UserPlan = { planId: 'free', status: 'expired', expiresAt }
    await cacheSet(cacheKey, result, 60)
    return result
  }

  const planId = subscription.plan_id as PlanId
  // Validate plan_id is a known plan
  if (!PLAN_LIMITS[planId]) {
    const result: UserPlan = { planId: 'free', status: 'none', expiresAt: null }
    await cacheSet(cacheKey, result, 60)
    return result
  }

  const result: UserPlan = {
    planId,
    status: subscription.status as UserPlan['status'],
    expiresAt,
  }
  await cacheSet(cacheKey, result, 60)
  return result
}

/**
 * Invalidate the cached plan for a user.
 * Call this when a subscription changes (purchase, cancel, etc.)
 */
export async function invalidateUserPlanCache(userId: string): Promise<void> {
  await cacheDel(`plan:${userId}`)
}

export interface PlanOverrides {
  monthly_budget_thb: number | null
  rate_chat_per_min: number | null
  rate_image_per_min: number | null
  rate_video_per_min: number | null
  rate_search_per_min: number | null
  allowed_models: string[] | null
  blocked_models: string[] | null
  notes: string | null
}

// Sentinel value to distinguish "no override exists" from "cache miss"
const NO_OVERRIDE_SENTINEL = '__NO_OVERRIDE__'

/**
 * Get admin-configured overrides for a plan tier from plan_overrides table.
 * Cached in Redis for 2 minutes. Returns null if no overrides set.
 */
export async function getPlanOverrides(planId: PlanId): Promise<PlanOverrides | null> {
  const cacheKey = `plan_overrides:${planId}`
  const cached = await cacheGet<PlanOverrides | string>(cacheKey)
  if (cached === NO_OVERRIDE_SENTINEL) return null
  if (cached !== undefined && cached !== null) return cached as PlanOverrides

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('plan_overrides')
      .select('monthly_budget_thb, rate_chat_per_min, rate_image_per_min, rate_video_per_min, rate_search_per_min, allowed_models, blocked_models, notes')
      .eq('plan_id', planId)
      .single()

    if (!data) {
      await cacheSet(cacheKey, NO_OVERRIDE_SENTINEL, 120)
      return null
    }

    await cacheSet(cacheKey, data, 120) // cache 2 min
    return data as PlanOverrides
  } catch {
    return null
  }
}

/**
 * Invalidate cached plan overrides.
 * Call this when admin changes plan overrides.
 */
export async function invalidatePlanOverridesCache(planId?: PlanId): Promise<void> {
  if (planId) {
    await cacheDel(`plan_overrides:${planId}`)
  } else {
    // Invalidate all plans
    await Promise.all(
      PLAN_HIERARCHY.map(p => cacheDel(`plan_overrides:${p}`))
    )
  }
}

// Keep for backwards compatibility with user_overrides table
export async function invalidateUserOverridesCache(userId: string): Promise<void> {
  await cacheDel(`user_overrides:${userId}`)
}

export interface PlanCheckResult {
  allowed: boolean
  reason?: string
  planId: PlanId
  budgetUsed?: number   // THB used this month
  budgetLimit?: number  // THB monthly budget
}

/**
 * Get the Redis key for a user's monthly budget reservation counter.
 */
function getBudgetKey(userId: string): string {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `budget:${userId}:${monthKey}`
}

/**
 * Atomically reserve budget for a request using Redis INCRBYFLOAT.
 * Returns { allowed, newTotal } or null if Redis is unavailable.
 * If the new total exceeds the budget, the reservation is rolled back.
 */
export async function reserveBudget(
  userId: string,
  estimatedCostThb: number,
  budgetLimit: number
): Promise<{ allowed: boolean; newTotal: number } | null> {
  const key = getBudgetKey(userId)
  // TTL: remainder of the month + 1 day buffer (max ~32 days)
  const ttlSeconds = 32 * 24 * 60 * 60

  const newTotal = await redisIncrByFloat(key, estimatedCostThb, ttlSeconds)
  if (newTotal === null) return null // Redis unavailable, caller uses DB fallback

  if (newTotal > budgetLimit) {
    // Over budget -- roll back the reservation
    await redisIncrByFloat(key, -estimatedCostThb)
    return { allowed: false, newTotal: newTotal - estimatedCostThb }
  }

  return { allowed: true, newTotal }
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
  await cacheSet(cacheKey, result, 60) // cache 1 min
  return result
}

/**
 * Check if a model is active and get its tier.
 * Returns { isActive, tier } or defaults if not found in DB.
 */
async function getModelInfo(modelKey: string): Promise<{ isActive: boolean; tier: PlanId }> {
  const cacheKey = `model_info:${modelKey}`
  const cached = await cacheGet<{ isActive: boolean; tier: PlanId }>(cacheKey)
  if (cached) return cached

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('ai_models')
    .select('is_active, tier')
    .eq('id', modelKey)
    .single()

  // If not in DB, treat as inactive to reject unknown/arbitrary model IDs
  const result = data
    ? { isActive: data.is_active !== false, tier: normalizeTier(data.tier) }
    : { isActive: false, tier: 'free' as PlanId }

  await cacheSet(cacheKey, result, 60) // cache 1 min
  return result
}

/**
 * Check whether a user is allowed to perform an action based on their plan.
 * Admin users bypass all limits.
 * Model access is determined by the model's tier in the DB.
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
  const overrides = await getPlanOverrides(userPlan.planId)

  // Resolve full model ID (e.g. 'deepseek-v3-2-251201') to short key (e.g. 'deepseek-v3-2')
  const resolvedModelKey = modelKey ? (getModelKey(modelKey) || modelKey) : undefined

  // Plan-level model whitelist/blocklist check (takes priority over tier check)
  if (resolvedModelKey && overrides) {
    // Whitelist takes priority over blocklist
    if (overrides.allowed_models && overrides.allowed_models.length > 0) {
      if (!overrides.allowed_models.includes(resolvedModelKey)) {
        return {
          allowed: false,
          reason: 'แพลนของคุณไม่มีสิทธิ์ใช้โมเดลนี้ กรุณาเลือกโมเดลอื่น',
          planId: userPlan.planId,
        }
      }
    } else if (overrides.blocked_models && overrides.blocked_models.length > 0) {
      if (overrides.blocked_models.includes(resolvedModelKey)) {
        return {
          allowed: false,
          reason: 'โมเดลนี้ถูกจำกัดสำหรับแพลนของคุณ กรุณาเลือกโมเดลอื่น',
          planId: userPlan.planId,
        }
      }
    }
  }

  // Check model access via DB tier
  if (resolvedModelKey) {
    const modelInfo = await getModelInfo(resolvedModelKey)

    // Check if model is disabled by admin
    if (!modelInfo.isActive) {
      return {
        allowed: false,
        reason: 'โมเดลนี้ถูกปิดใช้งานชั่วคราว กรุณาเลือกโมเดลอื่น',
        planId: userPlan.planId,
      }
    }

    // Tier hierarchy: user can only access models at their tier level or below
    const modelTier = normalizeTier(modelInfo.tier)
    const modelLevel = getPlanLevel(modelTier)
    const userLevel = getPlanLevel(userPlan.planId)
    if (modelLevel > userLevel) {
      const tierNames: Record<string, string> = { free: 'ฟรี', starter: 'เริ่มต้น', pro: 'โปร', premium: 'พรีเมียม' }
      return {
        allowed: false,
        reason: `โมเดลนี้ต้องใช้แพลน${tierNames[modelTier] || modelTier}ขึ้นไป กรุณาอัปเกรดเพื่อใช้งาน`,
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

  // Check video access - blocked entirely for plans without video capability
  if (action === 'video' && !limits.canGenerateVideos) {
    return {
      allowed: false,
      reason: 'แพลนของคุณไม่รองรับการสร้างวิดีโอ กรุณาอัปเกรดเพื่อใช้งาน',
      planId: userPlan.planId,
    }
  }

  // Search is unlimited (self-hosted SearXNG, no cost)
  if (action === 'search') {
    return { allowed: true, planId: userPlan.planId }
  }

  // Budget check — use plan override budget if set, otherwise use hardcoded default
  const budgetLimit = overrides?.monthly_budget_thb != null
    ? Number(overrides.monthly_budget_thb)
    : limits.monthlyBudgetThb

  if (budgetLimit > 0) {
    const costEstimate = estimatedCostThb || 0.01 // fallback tiny amount

    // Try atomic Redis reservation first to prevent race conditions.
    // Multiple concurrent requests each atomically increment the counter,
    // so they see each other's reservations immediately.
    const reservation = await reserveBudget(userId, costEstimate, budgetLimit)

    if (reservation) {
      // Redis available — use atomic reservation result
      if (!reservation.allowed) {
        return {
          allowed: false,
          reason: `วงเงินประจำเดือนหมดแล้ว (${reservation.newTotal.toFixed(2)}/${budgetLimit} บาท) กรุณาอัปเกรดแพลนหรือรอเดือนหน้า`,
          planId: userPlan.planId,
          budgetUsed: reservation.newTotal,
          budgetLimit,
        }
      }
    } else {
      // Redis unavailable — fall back to DB check (non-atomic, but better than nothing)
      const usedThb = await getMonthlyUsage(userId)

      if (usedThb + costEstimate > budgetLimit) {
        return {
          allowed: false,
          reason: `วงเงินประจำเดือนหมดแล้ว (${usedThb.toFixed(2)}/${budgetLimit} บาท) กรุณาอัปเกรดแพลนหรือรอเดือนหน้า`,
          planId: userPlan.planId,
          budgetUsed: usedThb,
          budgetLimit,
        }
      }
    }
  }

  return { allowed: true, planId: userPlan.planId }
}
