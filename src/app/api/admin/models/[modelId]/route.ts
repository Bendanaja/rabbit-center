import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

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
      icon,
      tier,
      is_active,
      daily_limit,
      hourly_limit,
      cooldown_seconds,
      priority,
      context_length,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (tier !== undefined) updateData.tier = tier;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (daily_limit !== undefined) updateData.daily_limit = daily_limit;
    if (hourly_limit !== undefined) updateData.hourly_limit = hourly_limit;
    if (cooldown_seconds !== undefined) updateData.cooldown_seconds = cooldown_seconds;
    if (priority !== undefined) updateData.priority = priority;
    if (context_length !== undefined) updateData.context_length = context_length;

    const { data, error } = await supabase
      .from('ai_models')
      .update(updateData)
      .eq('id', modelId)
      .select()
      .single();

    if (error) throw error;

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
  const auth2 = await verifyAdminAccess(request);
  if (!auth2.authorized) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}
