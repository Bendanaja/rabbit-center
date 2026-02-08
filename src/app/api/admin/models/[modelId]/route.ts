import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Update model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
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
