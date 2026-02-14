import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { sanitizeInput } from '@/lib/security';

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

// Ban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { reason, expires_at, is_permanent } = body;
    const adminUserId = auth.user.id;

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
        banned_by: adminUserId,
        reason: reason ? sanitizeInput(String(reason)).slice(0, 500) : 'Banned by admin',
        expires_at: is_permanent ? null : expires_at,
        is_permanent: !!is_permanent,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: adminUserId,
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
  const auth2 = await verifyAdminAccess(request);
  if (!auth2.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const supabase = createAdminClient();
    const adminUserId = auth2.user.id;

    const { error } = await supabase
      .from('user_bans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: adminUserId,
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
