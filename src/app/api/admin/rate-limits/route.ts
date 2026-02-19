import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: Request) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!data) return null;
  return { user, role: data.role as string };
}

// GET /api/admin/rate-limits — get all plan configs with overrides
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!['owner', 'admin'].includes(admin.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Get all plan overrides
    const { data: overrides } = await supabase
      .from('plan_overrides')
      .select('plan_id, monthly_budget_thb, rate_chat_per_min, rate_image_per_min, rate_video_per_min, rate_search_per_min, allowed_models, blocked_models, notes, updated_at');

    const overrideMap = new Map(
      overrides?.map(o => [o.plan_id, o]) || []
    );

    // Get available models
    const { data: models } = await supabase
      .from('ai_models')
      .select('id, name, provider, tier, is_active')
      .eq('is_active', true)
      .order('name');

    // Get subscriber counts per plan (including free plan in subscriptions table)
    const { data: subCounts } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active');

    const subscriberCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, premium: 0 };
    subCounts?.forEach(s => {
      subscriberCounts[s.plan_id] = (subscriberCounts[s.plan_id] || 0) + 1;
    });

    // Users without any subscription record are also free users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const usersWithSub = subCounts?.length || 0;
    const usersWithoutSub = (totalUsers || 0) - usersWithSub;
    if (usersWithoutSub > 0) {
      subscriberCounts.free += usersWithoutSub;
    }

    // Build response: 4 plan configs
    const plans = (['free', 'starter', 'pro', 'premium'] as const).map(planId => {
      const defaults = PLAN_LIMITS[planId];
      const override = overrideMap.get(planId);

      return {
        plan_id: planId,
        subscriber_count: subscriberCounts[planId] || 0,
        defaults: {
          monthly_budget_thb: defaults.monthlyBudgetThb,
          rate_chat_per_min: RATE_LIMITS.chat.maxRequests,
          rate_image_per_min: RATE_LIMITS.image.maxRequests,
          rate_video_per_min: RATE_LIMITS.video.maxRequests,
          rate_search_per_min: RATE_LIMITS.search.maxRequests,
        },
        overrides: override || null,
        has_overrides: !!override,
      };
    });

    return NextResponse.json({
      plans,
      available_models: models || [],
    });
  } catch (error) {
    console.error('Admin rate-limits list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limits' },
      { status: 500 }
    );
  }
}
