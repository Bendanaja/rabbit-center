import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Ban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { reason, expires_at, is_permanent, admin_user_id } = body;

    // Check if already banned
    const { data: existingBan } = await supabase
      .from('user_bans')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (existingBan) {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      );
    }

    // Create ban
    const { data, error } = await supabase
      .from('user_bans')
      .insert({
        user_id: userId,
        banned_by: admin_user_id,
        reason,
        expires_at: is_permanent ? null : expires_at,
        is_permanent: !!is_permanent,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: admin_user_id,
      p_action: 'ban_user',
      p_resource_type: 'user',
      p_resource_id: userId,
      p_details: { reason, is_permanent }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Ban user error:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

// Unban user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { admin_user_id } = body;

    const { error } = await supabase
      .from('user_bans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: admin_user_id,
      p_action: 'unban_user',
      p_resource_type: 'user',
      p_resource_id: userId,
      p_details: {}
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unban user error:', error);
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    );
  }
}
