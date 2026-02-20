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
  'gpt-oss-120b':     { inputPerMillion: 0,     outputPerMillion: 0,     tier: 'economy' },   // OpenRouter free tier

  // OpenRouter models (no discount - these are direct costs from OpenRouter)
  'nano-banana':      { inputPerMillion: 0.15,  outputPerMillion: 0.60,  tier: 'economy' },
  'nano-banana-pro':  { inputPerMillion: 2.00,  outputPerMillion: 12.00, tier: 'premium' },
  'gpt-5-2':          { inputPerMillion: 1.75,  outputPerMillion: 14.00, tier: 'premium' },
  'grok-4':           { inputPerMillion: 3.00,  outputPerMillion: 15.00, tier: 'premium' },
  'claude-4-6':       { inputPerMillion: 5.00,  outputPerMillion: 25.00, tier: 'premium' },
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

  // Replicate FLUX models (no discount - direct Replicate pricing)
  'flux-schnell':   { perImage: 0.003 },  // FLUX Schnell (~$0.003/run)
  'flux-1.1-pro':   { perImage: 0.04 },   // FLUX 1.1 Pro (~$0.04/run)
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
  return [
    {
      planId: 'free',
      monthlyRevenueTHB: 0,
      maxMonthlyCostTHB: 10,      // budget cap
      avgMonthlyCostTHB: 4,       // ~40% utilization
      maxMarginPercent: -100,
      worstMarginPercent: -100,
    },
    {
      planId: 'starter',
      monthlyRevenueTHB: 199,
      maxMonthlyCostTHB: 100,     // budget cap
      avgMonthlyCostTHB: 40,      // ~40% utilization
      maxMarginPercent: Math.round((1 - 40 / 199) * 100),
      worstMarginPercent: Math.round((1 - 100 / 199) * 100),
    },
    {
      planId: 'pro',
      monthlyRevenueTHB: 499,
      maxMonthlyCostTHB: 250,     // budget cap
      avgMonthlyCostTHB: 100,     // ~40% utilization
      maxMarginPercent: Math.round((1 - 100 / 499) * 100),
      worstMarginPercent: Math.round((1 - 250 / 499) * 100),
    },
    {
      planId: 'premium',
      monthlyRevenueTHB: 799,
      maxMonthlyCostTHB: 400,     // budget cap
      avgMonthlyCostTHB: 160,     // ~40% utilization
      maxMarginPercent: Math.round((1 - 160 / 799) * 100),
      worstMarginPercent: Math.round((1 - 400 / 799) * 100),
    },
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
