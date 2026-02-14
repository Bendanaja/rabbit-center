/**
 * Internal Token Cost Model for RabbitHub AI
 *
 * This file contains the ACTUAL costs from BytePlus ModelArk API
 * with the negotiated 40% discount applied.
 *
 * IMPORTANT: This file is SERVER-ONLY. Never import in client components.
 * Customers should NOT see these numbers.
 */

// Exchange rate: 1 USD ≈ 34 THB
const USD_TO_THB = 34

// BytePlus discount: 40% off list price
const DISCOUNT_RATE = 0.40

// ═══════════════════════════════════════════
// Chat Model Costs (USD per 1M tokens, AFTER 40% discount)
// ═══════════════════════════════════════════

export interface ModelCost {
  inputPerMillion: number   // USD per 1M input tokens (after discount)
  outputPerMillion: number  // USD per 1M output tokens (after discount)
  tier: 'economy' | 'standard' | 'premium' // cost tier for internal tracking
}

export const CHAT_MODEL_COSTS: Record<string, ModelCost> = {
  // DeepSeek models
  'deepseek-r1':      { inputPerMillion: 0.33,  outputPerMillion: 1.314, tier: 'premium' },   // Reasoning model
  'deepseek-v3-2':    { inputPerMillion: 0.084, outputPerMillion: 0.168, tier: 'economy' },   // Latest V3
  'deepseek-v3-1':    { inputPerMillion: 0.336, outputPerMillion: 1.008, tier: 'standard' },   // V3.1

  // ByteDance Seed models
  'seed-1-8':         { inputPerMillion: 0.15,  outputPerMillion: 1.20,  tier: 'standard' },   // Latest Seed
  'seed-1-6':         { inputPerMillion: 0.15,  outputPerMillion: 1.20,  tier: 'standard' },   // Seed 1.6
  'seed-1-6-flash':   { inputPerMillion: 0.06,  outputPerMillion: 0.30,  tier: 'economy' },   // Flash (cheapest)

  // Moonshot Kimi models
  'kimi-k2-thinking': { inputPerMillion: 0.36,  outputPerMillion: 1.50,  tier: 'premium' },   // Thinking/reasoning
  'kimi-k2':          { inputPerMillion: 0.30,  outputPerMillion: 1.44,  tier: 'standard' },   // Standard Kimi

  // Other models
  'glm-4':            { inputPerMillion: 0.12,  outputPerMillion: 0.60,  tier: 'economy' },   // Zhipu GLM
  'gpt-oss-120b':     { inputPerMillion: 0.18,  outputPerMillion: 0.90,  tier: 'standard' },   // 120B open-source
}

// ═══════════════════════════════════════════
// Image Generation Costs (USD per image, AFTER 40% discount)
// ═══════════════════════════════════════════

export interface ImageCost {
  perImage: number // USD per image (after discount)
}

export const IMAGE_MODEL_COSTS: Record<string, ImageCost> = {
  'seedream-3':   { perImage: 0.015 },  // Seedream 3.0
  'seedream-4':   { perImage: 0.018 },  // Seedream 4.0
  'seedream-4-5': { perImage: 0.024 },  // Seedream 4.5 (highest quality)
}

// ═══════════════════════════════════════════
// Video Generation Costs (USD per video, AFTER 40% discount)
// Based on token consumption: (W x H x FPS x Duration) / 1024
// Estimated for typical 5-second 720p video
// ═══════════════════════════════════════════

export interface VideoCost {
  perVideoEstimate: number // USD per typical 5s 720p video (after discount)
  perMillionTokens: number // USD per 1M video tokens (after discount)
}

export const VIDEO_MODEL_COSTS: Record<string, VideoCost> = {
  'seedance-lite-t2v':  { perVideoEstimate: 0.035, perMillionTokens: 0.48 },
  'seedance-lite-i2v':  { perVideoEstimate: 0.035, perMillionTokens: 0.48 },
  'seedance-pro':       { perVideoEstimate: 0.078, perMillionTokens: 0.72 },
  'seedance-pro-fast':  { perVideoEstimate: 0.022, perMillionTokens: 0.20 },  // 72% cheaper than Pro
  'seedance-1-5-pro':   { perVideoEstimate: 0.078, perMillionTokens: 0.72 },
}

// ═══════════════════════════════════════════
// Cost Calculation Helpers
// ═══════════════════════════════════════════

/**
 * Estimate cost of a single chat message (input + output)
 * Avg message: ~2K input tokens (with history), ~500 output tokens
 */
export function estimateChatCost(
  modelKey: string,
  inputTokens: number = 2000,
  outputTokens: number = 500
): { usd: number; thb: number } {
  const cost = CHAT_MODEL_COSTS[modelKey]
  if (!cost) {
    // Unknown model - use standard tier average
    const usd = (2000 * 0.15 / 1_000_000) + (500 * 1.00 / 1_000_000)
    return { usd, thb: usd * USD_TO_THB }
  }

  const usd = (inputTokens * cost.inputPerMillion / 1_000_000) +
              (outputTokens * cost.outputPerMillion / 1_000_000)
  return { usd, thb: usd * USD_TO_THB }
}

/**
 * Get image generation cost
 */
export function getImageCost(modelKey: string): { usd: number; thb: number } {
  const cost = IMAGE_MODEL_COSTS[modelKey]
  if (!cost) {
    // Default to highest cost model for safety
    return { usd: 0.024, thb: 0.024 * USD_TO_THB }
  }
  return { usd: cost.perImage, thb: cost.perImage * USD_TO_THB }
}

/**
 * Get video generation cost estimate
 */
export function getVideoCost(modelKey: string): { usd: number; thb: number } {
  const cost = VIDEO_MODEL_COSTS[modelKey]
  if (!cost) {
    return { usd: 0.078, thb: 0.078 * USD_TO_THB }
  }
  return { usd: cost.perVideoEstimate, thb: cost.perVideoEstimate * USD_TO_THB }
}

// ═══════════════════════════════════════════
// Plan Profitability Analysis
// ═══════════════════════════════════════════

export interface PlanCostAnalysis {
  planId: string
  monthlyRevenueTHB: number
  maxMonthlyCostTHB: number
  avgMonthlyCostTHB: number  // Assumes 40% utilization
  maxMarginPercent: number   // At average usage
  worstMarginPercent: number // At 100% max usage
}

/**
 * Calculate profitability for each plan.
 * This is for internal analysis - never expose to users.
 */
export function analyzePlanProfitability(): PlanCostAnalysis[] {
  const DAYS_PER_MONTH = 30

  return [
    // Free: 30 msgs/day, Flash only, no images/videos
    (() => {
      const chatCost = 30 * DAYS_PER_MONTH * estimateChatCost('seed-1-6-flash').thb
      return {
        planId: 'free',
        monthlyRevenueTHB: 0,
        maxMonthlyCostTHB: chatCost,
        avgMonthlyCostTHB: chatCost * 0.3, // Free users use less
        maxMarginPercent: -100,
        worstMarginPercent: -100,
      }
    })(),

    // Starter: 100 msgs/day, 3 models, 5 images/day
    (() => {
      const avgChatCost = estimateChatCost('seed-1-6-flash').thb * 0.5 +
                          estimateChatCost('deepseek-v3-1').thb * 0.3 +
                          estimateChatCost('glm-4').thb * 0.2
      const chatMax = 100 * DAYS_PER_MONTH * avgChatCost
      const imageMax = 5 * DAYS_PER_MONTH * getImageCost('seedream-4-5').thb
      const total = chatMax + imageMax
      const revenue = 199
      return {
        planId: 'starter',
        monthlyRevenueTHB: revenue,
        maxMonthlyCostTHB: total,
        avgMonthlyCostTHB: total * 0.35,
        maxMarginPercent: Math.round((1 - total * 0.35 / revenue) * 100),
        worstMarginPercent: Math.round((1 - total / revenue) * 100),
      }
    })(),

    // Pro: 500 msgs/day, all models, 30 images/day, 3 videos/day
    (() => {
      const avgChatCost = estimateChatCost('seed-1-8').thb  // weighted average
      const chatMax = 500 * DAYS_PER_MONTH * avgChatCost
      const imageMax = 30 * DAYS_PER_MONTH * getImageCost('seedream-4-5').thb
      const videoMax = 3 * DAYS_PER_MONTH * getVideoCost('seedance-1-5-pro').thb
      const total = chatMax + imageMax + videoMax
      const revenue = 499
      return {
        planId: 'pro',
        monthlyRevenueTHB: revenue,
        maxMonthlyCostTHB: total,
        avgMonthlyCostTHB: total * 0.30,
        maxMarginPercent: Math.round((1 - total * 0.30 / revenue) * 100),
        worstMarginPercent: Math.round((1 - total / revenue) * 100),
      }
    })(),

    // Premium: 1500 msgs/day, all models, 100 images/day, 10 videos/day
    (() => {
      const avgChatCost = estimateChatCost('deepseek-r1').thb // heaviest users
      const chatMax = 1500 * DAYS_PER_MONTH * avgChatCost
      const imageMax = 100 * DAYS_PER_MONTH * getImageCost('seedream-4-5').thb
      const videoMax = 10 * DAYS_PER_MONTH * getVideoCost('seedance-1-5-pro').thb
      const total = chatMax + imageMax + videoMax
      const revenue = 799
      return {
        planId: 'premium',
        monthlyRevenueTHB: revenue,
        maxMonthlyCostTHB: total,
        avgMonthlyCostTHB: total * 0.25,
        maxMarginPercent: Math.round((1 - total * 0.25 / revenue) * 100),
        worstMarginPercent: Math.round((1 - total / revenue) * 100),
      }
    })(),
  ]
}

// ═══════════════════════════════════════════
// Token Usage Tracking (for internal cost monitoring)
// ═══════════════════════════════════════════

export interface TokenUsageRecord {
  userId: string
  modelKey: string
  action: 'chat' | 'image' | 'video'
  inputTokens?: number
  outputTokens?: number
  estimatedCostUSD: number
}

/**
 * Calculate the estimated cost of a usage event.
 * Call this from API routes to track actual costs.
 */
export function calculateUsageCost(record: Omit<TokenUsageRecord, 'estimatedCostUSD'>): number {
  switch (record.action) {
    case 'chat': {
      const { usd } = estimateChatCost(
        record.modelKey,
        record.inputTokens || 2000,
        record.outputTokens || 500
      )
      return usd
    }
    case 'image':
      return getImageCost(record.modelKey).usd
    case 'video':
      return getVideoCost(record.modelKey).usd
    default:
      return 0
  }
}

// Export constants for reference
export { USD_TO_THB, DISCOUNT_RATE }
