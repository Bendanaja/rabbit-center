import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MODELS } from '@/lib/byteplus'

export const dynamic = 'force-dynamic'

// Derive provider icon from model ID slug (for OpenRouter models without icon_url in DB)
const PROVIDER_ICONS: Record<string, string> = {
  'openai': '/images/models/openai.svg',
  'anthropic': '/images/models/anthropic.svg',
  'google': '/images/models/google.svg',
  'deepseek': '/images/models/deepseek.svg',
  'meta-llama': '/images/models/meta.svg',
  'meta': '/images/models/meta.svg',
  'mistralai': '/images/models/mistral.svg',
  'mistral': '/images/models/mistral.svg',
  'x-ai': '/images/models/xai.svg',
  'nvidia': '/images/models/nvidia.svg',
  'qwen': '/images/models/byteplus.svg',
  'stepfun': '/images/models/stepfun.svg',
  'moonshotai': '/images/models/kimi.svg',
  'moonshot': '/images/models/kimi.svg',
  'zhipu': '/images/models/zhipu.svg',
  'thudm': '/images/models/zhipu.svg',
}

function resolveIcon(modelId: string, iconUrl: string | null, defIcon?: string): string {
  if (iconUrl) return iconUrl
  if (defIcon) return defIcon
  // Try to derive from model ID slug (e.g. "openai/gpt-5" → "openai")
  const slug = modelId.split('/')[0]?.toLowerCase()
  if (slug && PROVIDER_ICONS[slug]) return PROVIDER_ICONS[slug]
  return '/images/models/byteplus.svg'
}

// Public endpoint: returns the full active model list from DB
// This is the single source of truth for the chat model selector
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('ai_models')
      .select('id, name, provider, icon_url, tier, is_active, context_window')
      .order('priority', { ascending: false })

    if (!data) {
      return NextResponse.json({ models: [], disabledModels: [], modelTiers: {} })
    }

    const disabledModels = data
      .filter(m => m.is_active === false)
      .map(m => m.id)

    const modelTiers: Record<string, string> = {}
    data.forEach(m => {
      modelTiers[m.id] = m.tier === 'enterprise' ? 'premium' : m.tier
    })

    // Build full model list for the chat selector
    const models = data
      .filter(m => m.is_active)
      .map(m => {
        const def = MODELS[m.id]
        return {
          key: m.id,
          id: def?.id || m.id,  // full API model ID (e.g. 'deepseek-r1-250528')
          name: m.name,
          provider: m.provider,
          icon: resolveIcon(m.id, m.icon_url, def?.icon),
          tier: m.tier === 'enterprise' ? 'premium' : m.tier,
          isFree: (m.tier === 'free'),
          modelType: def?.modelType || (m.id.includes('seedream') ? 'image' : m.id.includes('seedance') ? 'video' : 'chat'),
          apiProvider: def?.apiProvider || (m.id.includes('/') ? 'openrouter' : 'byteplus'),
        }
      })

    return NextResponse.json({ models, disabledModels, modelTiers }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch {
    return NextResponse.json({ models: [], disabledModels: [], modelTiers: {} })
  }
}
