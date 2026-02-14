import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { MODELS } from '@/lib/byteplus';

export const dynamic = 'force-dynamic';

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
    .select('model_id');

  const existingIds = new Set((existing || []).map(m => m.model_id));

  const toInsert = Object.entries(MODELS)
    .filter(([key]) => !existingIds.has(key))
    .map(([key, def], idx) => ({
      model_id: key,
      name: def.name,
      provider: def.provider,
      icon: def.icon,
      description: `${def.modelType.toUpperCase()} model — ${def.provider}`,
      tier: 'pro' as const,
      is_active: true,
      daily_limit: null,
      hourly_limit: null,
      cooldown_seconds: 0,
      priority: 100 - idx,
      context_length: def.maxContextTokens || null,
    }));

  if (toInsert.length > 0) {
    await supabase.from('ai_models').insert(toInsert);
  }
}

// Get all models
export async function GET(request: Request) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Auto-sync real models from byteplus.ts into DB
    await syncModelsToDb();

    const { data: models, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;

    // Get usage stats for each model (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: usage } = await supabase
      .from('usage_records')
      .select('model_id, tokens_input, tokens_output')
      .gte('date', weekAgo.toISOString().split('T')[0]);

    const usageMap = new Map<string, { requests: number; tokens: number }>();
    usage?.forEach((u: { model_id: string; tokens_input: number; tokens_output: number }) => {
      const current = usageMap.get(u.model_id) || { requests: 0, tokens: 0 };
      usageMap.set(u.model_id, {
        requests: current.requests + 1,
        tokens: current.tokens + (u.tokens_input || 0) + (u.tokens_output || 0),
      });
    });

    // Enrich with modelType from MODELS constant
    const modelsWithStats = models?.map(model => ({
      ...model,
      model_type: MODELS[model.model_id]?.modelType || 'chat',
      usage_stats: usageMap.get(model.model_id) || { requests: 0, tokens: 0 },
    }));

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
      model_id,
      name,
      provider,
      description,
      icon,
      tier,
      daily_limit,
      hourly_limit,
      cooldown_seconds,
      priority,
      context_length,
    } = body;

    const { data, error } = await supabase
      .from('ai_models')
      .insert({
        model_id,
        name,
        provider,
        description,
        icon,
        tier: tier || 'pro',
        is_active: true,
        daily_limit,
        hourly_limit,
        cooldown_seconds: cooldown_seconds || 0,
        priority: priority || 0,
        context_length,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json(
      { error: 'Failed to create model' },
      { status: 500 }
    );
  }
}
