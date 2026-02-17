import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { invalidatePlanOverridesCache } from '@/lib/plan-limits';

export const dynamic = 'force-dynamic';

const VALID_PLANS = ['free', 'starter', 'pro', 'premium'];

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

// PUT /api/admin/rate-limits/[planId] — upsert plan overrides
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!['owner', 'admin'].includes(admin.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { planId } = await params;

    if (!VALID_PLANS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const body = await request.json();

    const {
      monthly_budget_thb,
      rate_chat_per_min,
      rate_image_per_min,
      rate_video_per_min,
      rate_search_per_min,
      allowed_models,
      blocked_models,
      notes,
    } = body;

    // Validate numeric fields
    if (monthly_budget_thb != null && (typeof monthly_budget_thb !== 'number' || !Number.isFinite(monthly_budget_thb) || monthly_budget_thb < 0 || monthly_budget_thb > 100000)) {
      return NextResponse.json({ error: 'monthly_budget_thb must be a number between 0 and 100000' }, { status: 400 });
    }
    for (const [field, value] of Object.entries({ rate_chat_per_min, rate_image_per_min, rate_video_per_min, rate_search_per_min })) {
      if (value != null && (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 1 || value > 10000)) {
        return NextResponse.json({ error: `${field} must be an integer between 1 and 10000` }, { status: 400 });
      }
    }

    // Validate notes
    if (notes != null && (typeof notes !== 'string' || notes.length > 500)) {
      return NextResponse.json({ error: 'notes must be a string with max 500 characters' }, { status: 400 });
    }

    // Validate model arrays
    for (const [field, value] of Object.entries({ allowed_models, blocked_models })) {
      if (value != null) {
        if (!Array.isArray(value) || value.length > 200 || !value.every((v: unknown) => typeof v === 'string')) {
          return NextResponse.json({ error: `${field} must be an array of strings with max 200 items` }, { status: 400 });
        }
      }
    }

    const supabase = createAdminClient();

    const overrideData = {
      plan_id: planId,
      monthly_budget_thb: monthly_budget_thb ?? null,
      rate_chat_per_min: rate_chat_per_min ?? null,
      rate_image_per_min: rate_image_per_min ?? null,
      rate_video_per_min: rate_video_per_min ?? null,
      rate_search_per_min: rate_search_per_min ?? null,
      allowed_models: allowed_models ?? null,
      blocked_models: blocked_models ?? null,
      notes: notes ?? null,
      updated_by: admin.user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('plan_overrides')
      .upsert(overrideData, { onConflict: 'plan_id' })
      .select()
      .single();

    if (error) throw error;

    // Invalidate all caches for this plan immediately
    await invalidatePlanOverridesCache(planId as 'free' | 'starter' | 'pro' | 'premium');

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: admin.user.id,
      p_action: 'update_plan_overrides',
      p_resource_type: 'plan_overrides',
      p_resource_id: planId,
      p_details: overrideData,
    });

    return NextResponse.json({ success: true, overrides: data });
  } catch (error) {
    console.error('Admin plan overrides update error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan overrides' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rate-limits/[planId] — reset plan to defaults
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!['owner', 'admin'].includes(admin.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { planId } = await params;

    if (!VALID_PLANS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('plan_overrides')
      .delete()
      .eq('plan_id', planId);

    if (error) throw error;

    // Invalidate caches
    await invalidatePlanOverridesCache(planId as 'free' | 'starter' | 'pro' | 'premium');

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: admin.user.id,
      p_action: 'reset_plan_overrides',
      p_resource_type: 'plan_overrides',
      p_resource_id: planId,
      p_details: { reset_to_defaults: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin plan overrides delete error:', error);
    return NextResponse.json(
      { error: 'Failed to reset plan overrides' },
      { status: 500 }
    );
  }
}
