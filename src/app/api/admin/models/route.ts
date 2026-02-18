import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { MODELS } from '@/lib/byteplus';
import { invalidateModelAccessCache } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

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
};

function resolveIcon(modelId: string, iconUrl: string | null, defIcon?: string): string {
  if (iconUrl) return iconUrl;
  if (defIcon) return defIcon;
  const slug = modelId.split('/')[0]?.toLowerCase();
  if (slug && PROVIDER_ICONS[slug]) return PROVIDER_ICONS[slug];
  return '/images/models/byteplus.svg';
}

// Verify admin access
async function verifyAdminAccess(request: Request) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) return { authorized: false as const };

  const supabase = createAdminClient();
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) return { authorized: false as const };
  return { authorized: true as const, user, role: adminData.role as string };
}

/**
 * Auto-sync: ensure every model from byteplus.ts MODELS exists in the ai_models DB table.
 * New models default to is_active=true. Existing rows are not overwritten.
 */
async function syncModelsToDb() {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('ai_models')
    .select('id');

  const existingIds = new Set((existing || []).map(m => m.id));

  const toInsert = Object.entries(MODELS)
    .filter(([key]) => !existingIds.has(key))
    .map(([key, def], idx) => ({
      id: key,
      name: def.name,
      provider: def.provider,
      icon_url: def.icon,
      description: `${def.modelType.toUpperCase()} model — ${def.provider}`,
      tier: def.isFree ? 'free' : 'starter',
      is_active: true,
      daily_limit: null,
      hourly_limit: null,
      cooldown_seconds: 0,
      priority: 100 - idx,
      context_window: def.maxContextTokens || null,
      max_tokens: 4096,
      supports_streaming: def.modelType === 'chat',
      display_order: idx,
      capabilities: def.capabilities || [],
    }));

  if (toInsert.length > 0) {
    await supabase.from('ai_models').insert(toInsert);
  }
}

// Track if sync has run this process lifecycle
let syncDone = false;

// Get all models
export async function GET(request: Request) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Auto-sync only once per server lifecycle (or if ?sync=1)
    const url = new URL(request.url);
    if (!syncDone || url.searchParams.get('sync') === '1') {
      await syncModelsToDb();
      syncDone = true;
    }

    // Run both queries in parallel
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [modelsResult, usageResult] = await Promise.all([
      supabase
        .from('ai_models')
        .select('*')
        .order('priority', { ascending: false }),
      supabase
        .from('usage_records')
        .select('model_id, tokens_input, tokens_output')
        .gte('date', weekAgo.toISOString().split('T')[0])
        .limit(5000),
    ]);

    if (modelsResult.error) throw modelsResult.error;

    const usageMap = new Map<string, { requests: number; tokens: number }>();
    usageResult.data?.forEach((u: { model_id: string; tokens_input: number; tokens_output: number }) => {
      const current = usageMap.get(u.model_id) || { requests: 0, tokens: 0 };
      usageMap.set(u.model_id, {
        requests: current.requests + 1,
        tokens: current.tokens + (u.tokens_input || 0) + (u.tokens_output || 0),
      });
    });

    // Enrich with modelType from MODELS constant, fallback to 'chat'
    const modelsWithStats = modelsResult.data?.map(model => {
      const modelDef = MODELS[model.id];
      return {
        ...model,
        icon_url: resolveIcon(model.id, model.icon_url, modelDef?.icon),
        model_type: modelDef?.modelType || 'chat',
        api_provider: modelDef?.apiProvider || (model.id.includes('/') ? 'openrouter' : 'byteplus'),
        usage_stats: usageMap.get(model.id) || { requests: 0, tokens: 0 },
      };
    });

    return NextResponse.json(modelsWithStats);
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

// Create new model
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const {
      id,
      name,
      provider,
      description,
      icon_url,
      tier,
      daily_limit,
      hourly_limit,
      cooldown_seconds,
      priority,
      context_window,
      max_tokens,
      input_cost_per_1k,
      output_cost_per_1k,
      capabilities,
    } = body;

    if (!id || !name || !provider) {
      return NextResponse.json(
        { error: 'id, name, and provider are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('ai_models')
      .select('id')
      .eq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Model with this ID already exists' },
        { status: 409 }
      );
    }

    // Map tier to DB-valid values ('free', 'starter', 'pro', 'premium')
    const validTiers = ['free', 'starter', 'pro', 'premium'];
    const dbTier = validTiers.includes(tier) ? tier : 'pro';

    const { data, error } = await supabase
      .from('ai_models')
      .insert({
        id,
        name,
        provider,
        description: description || `Chat model — ${provider}`,
        icon_url: icon_url || null,
        tier: dbTier,
        is_active: true,
        daily_limit: daily_limit || null,
        hourly_limit: hourly_limit || null,
        cooldown_seconds: cooldown_seconds || 0,
        priority: priority || 0,
        context_window: context_window || null,
        max_tokens: max_tokens || 4096,
        input_cost_per_1k: input_cost_per_1k || null,
        output_cost_per_1k: output_cost_per_1k || null,
        supports_streaming: true,
        display_order: 0,
        capabilities: Array.isArray(capabilities) ? capabilities : [],
      })
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget: don't block the response for cache invalidation
    invalidateModelAccessCache().catch(() => {});

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}
