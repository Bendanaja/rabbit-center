import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Get all models
export async function GET() {
  try {
    const supabase = createAdminClient();

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

    const modelsWithStats = models?.map(model => ({
      ...model,
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
