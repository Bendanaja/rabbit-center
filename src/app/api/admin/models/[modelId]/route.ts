import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { invalidateModelAccessCache } from '@/lib/plan-limits';

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

// Update model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { modelId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const {
      name,
      description,
      icon_url,
      tier,
      is_active,
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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon_url !== undefined) updateData.icon_url = icon_url;
    if (tier !== undefined) {
      // Map to DB-valid values ('free', 'starter', 'pro', 'premium')
      const validTiers = ['free', 'starter', 'pro', 'premium'];
      updateData.tier = validTiers.includes(tier) ? tier : 'pro';
    }
    if (is_active !== undefined) updateData.is_active = is_active;
    if (daily_limit !== undefined) updateData.daily_limit = daily_limit;
    if (hourly_limit !== undefined) updateData.hourly_limit = hourly_limit;
    if (cooldown_seconds !== undefined) updateData.cooldown_seconds = cooldown_seconds;
    if (priority !== undefined) updateData.priority = priority;
    if (context_window !== undefined) updateData.context_window = context_window;
    if (max_tokens !== undefined) updateData.max_tokens = max_tokens;
    if (input_cost_per_1k !== undefined) updateData.input_cost_per_1k = input_cost_per_1k;
    if (output_cost_per_1k !== undefined) updateData.output_cost_per_1k = output_cost_per_1k;
    if (capabilities !== undefined) updateData.capabilities = Array.isArray(capabilities) ? capabilities : [];

    const { data, error } = await supabase
      .from('ai_models')
      .update(updateData)
      .eq('id', modelId)
      .select()
      .single();

    if (error) throw error;

    // Fire-and-forget: don't block the response for cache invalidation
    invalidateModelAccessCache().catch(() => {});

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update model error:', error);
    return NextResponse.json(
      { error: 'Failed to update model' },
      { status: 500 }
    );
  }
}

// Delete model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { modelId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', modelId);

    if (error) throw error;

    // Fire-and-forget: don't block the response for cache invalidation
    invalidateModelAccessCache().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}
