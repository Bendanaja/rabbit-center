import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { sanitizeInput, INPUT_LIMITS } from '@/lib/security';
import { invalidateUserPlanCache } from '@/lib/plan-limits';

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

// Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const supabase = createAdminClient();

    // Get user profile
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        subscriptions(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    // Get ban status
    const { data: ban } = await supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Get chat count
    const { count: chatCount } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get message count
    const { data: chats } = await supabase
      .from('chats')
      .select('id')
      .eq('user_id', userId);

    const chatIds = chats?.map(c => c.id) || [];
    const { count: messageCount } = chatIds.length > 0
      ? await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('chat_id', chatIds)
      : { count: 0 };

    // Get usage records
    const { data: usage } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      ...user,
      is_banned: !!ban,
      ban_details: ban,
      chat_count: chatCount || 0,
      message_count: messageCount || 0,
      recent_usage: usage || [],
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(
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

    const { full_name, avatar_url } = body;

    // Validate and sanitize
    const safeName = full_name ? sanitizeInput(String(full_name)).slice(0, INPUT_LIMITS.fullName) : full_name;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: safeName,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user plan, ban/unban
export async function PATCH(
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

    const { action, plan_id, ban_reason, ban_permanent, ban_expires_at, admin_user_id } = body as {
      action: 'update_plan' | 'ban' | 'unban';
      plan_id?: string;
      ban_reason?: string;
      ban_permanent?: boolean;
      ban_expires_at?: string;
      admin_user_id?: string;
    };

    if (action === 'update_plan' && plan_id) {
      // Cancel existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // If plan is not 'free', create a new subscription
      if (plan_id !== 'free') {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id,
            status: 'active',
            expires_at: expiresAt.toISOString(),
          });
      }

      // Invalidate Redis cache for this user's plan
      await invalidateUserPlanCache(userId);

      return NextResponse.json({ success: true, action: 'update_plan', plan_id });
    }

    if (action === 'ban') {
      // Deactivate any existing bans first
      await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId);

      await supabase
        .from('user_bans')
        .insert({
          user_id: userId,
          banned_by: admin_user_id || 'admin',
          reason: ban_reason ? sanitizeInput(ban_reason).slice(0, 500) : 'Banned by admin',
          is_permanent: ban_permanent ?? false,
          expires_at: ban_expires_at || null,
          is_active: true,
        });

      return NextResponse.json({ success: true, action: 'ban' });
    }

    if (action === 'unban') {
      await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      return NextResponse.json({ success: true, action: 'unban' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Patch user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user (soft delete by banning permanently)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const supabase = createAdminClient();

    // Cancel any active subscriptions
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);

    // Permanently ban the user
    await supabase
      .from('user_bans')
      .insert({
        user_id: userId,
        banned_by: 'system',
        reason: 'Account deleted by admin',
        is_permanent: true,
        is_active: true,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
