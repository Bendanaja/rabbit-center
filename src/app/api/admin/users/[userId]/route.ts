import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('chat_id', chatIds);

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
  try {
    const { userId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { full_name, avatar_url } = body;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name,
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

// Delete user (soft delete by banning permanently)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
