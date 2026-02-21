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

function isVideoUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|avi|mkv)$/.test(path);
}

function resolveIcon(modelId: string, iconUrl: string | null, defIcon?: string): string {
  if (iconUrl && !isVideoUrl(iconUrl)) return iconUrl;
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
 * Replicate models from MODELS get '__replicate' injected into capabilities.
 */
async function syncModelsToDb() {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from('ai_models')
    .select('id, capabilities');

  const existingMap = new Map((existing || []).map(m => [m.id, m.capabilities as string[] | null]));

  const toInsert = Object.entries(MODELS)
    .filter(([key]) => !existingMap.has(key))
    .map(([key, def], idx) => {
      // Inject __replicate tag for Replicate provider models
      const caps = [...(def.capabilities || [])];
      if (def.apiProvider === 'replicate' && !caps.includes('__replicate')) {
        caps.push('__replicate');
      }
      return {
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
        capabilities: caps,
      };
    });

  if (toInsert.length > 0) {
    await supabase.from('ai_models').insert(toInsert);
  }

  // Fix existing Replicate models missing __replicate tag
  for (const [key, def] of Object.entries(MODELS)) {
    if (def.apiProvider === 'replicate' && existingMap.has(key)) {
      const existingCaps = existingMap.get(key) || [];
      if (!existingCaps.includes('__replicate')) {
        await supabase
          .from('ai_models')
          .update({ capabilities: [...existingCaps, '__replicate'] })
          .eq('id', key);
      }
    }
  }
}

/**
 * Auto-sync: fetch ALL image/video models from Replicate curated collections
 * and insert them into the DB. New models default to is_active=false (admin enables them).
 */
let replicateSyncDone = false;

async function syncReplicateModels() {
  try {
    const { fetchReplicateCollection } = await import('@/lib/replicate');
    const supabase = createAdminClient();

    // Fetch existing model IDs
    const { data: existing } = await supabase.from('ai_models').select('id');
    const existingIds = new Set((existing || []).map(m => m.id));

    // Fetch from curated Replicate collections
    const collections = [
      { slug: 'text-to-image', modelType: 'image', capabilities: ['t2i', '__replicate'] },
      { slug: 'image-to-image', modelType: 'image', capabilities: ['i2i', '__replicate'] },
      { slug: 'text-to-video', modelType: 'video', capabilities: ['t2v', '__replicate'] },
      { slug: 'image-to-video', modelType: 'video', capabilities: ['i2v', '__replicate'] },
    ];

    const toInsert: Array<Record<string, unknown>> = [];

    for (const col of collections) {
      const models = await fetchReplicateCollection(col.slug);
      for (const m of models) {
        const modelId = `${m.owner}/${m.name}`;
        if (existingIds.has(modelId)) continue;
        existingIds.add(modelId); // prevent dups across collections

        const displayName = m.name
          .split('-')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        toInsert.push({
          id: modelId,
          name: displayName,
          provider: m.owner,
          icon_url: m.cover_image_url || null,
          description: (m.description || '').slice(0, 500) || `${col.modelType.toUpperCase()} model — ${m.owner}`,
          tier: 'pro',
          is_active: false, // Admin must enable
          daily_limit: null,
          hourly_limit: null,
          cooldown_seconds: 0,
          priority: 0,
          context_window: null,
          max_tokens: 0,
          supports_streaming: false,
          display_order: 0,
          capabilities: col.capabilities,
        });
      }
    }

    if (toInsert.length > 0) {
      // Insert in batches to avoid payload limits
      const batchSize = 50;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        await supabase.from('ai_models').insert(toInsert.slice(i, i + batchSize));
      }
      console.log(`[Replicate Sync] Inserted ${toInsert.length} new models from Replicate collections`);
    }
  } catch (error) {
    console.error('[Replicate Sync] Failed to sync Replicate models:', error);
    // Non-fatal: don't block the response
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
    const forceSync = url.searchParams.get('sync') === '1';
    if (!syncDone || forceSync) {
      await syncModelsToDb();
      syncDone = true;
    }
    // Replicate collection sync (separate flag — depends on external API)
    if (!replicateSyncDone || forceSync) {
      await syncReplicateModels();
      replicateSyncDone = true;
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
        model_type: modelDef?.modelType || (model.capabilities?.some((c: string) => ['t2i','i2i'].includes(c)) ? 'image' : model.capabilities?.some((c: string) => ['t2v','i2v'].includes(c)) ? 'video' : 'chat'),
        api_provider: modelDef?.apiProvider || (model.capabilities?.includes('__replicate') ? 'replicate' : model.id.includes('/') ? 'openrouter' : 'byteplus'),
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
      model_type,
      api_provider,
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

    // Build capabilities array — inject provider tag for non-MODELS models
    let dbCapabilities = Array.isArray(capabilities) ? [...capabilities] : [];
    if (api_provider === 'replicate' && !dbCapabilities.includes('__replicate')) {
      dbCapabilities.push('__replicate');
    }

    const typeLabel = model_type === 'image' ? 'Image' : model_type === 'video' ? 'Video' : 'Chat';

    const { data, error } = await supabase
      .from('ai_models')
      .insert({
        id,
        name,
        provider,
        description: description || `${typeLabel} model — ${provider}`,
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
        supports_streaming: model_type === 'chat' || !model_type,
        display_order: 0,
        capabilities: dbCapabilities,
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
