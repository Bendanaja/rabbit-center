import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'banned', 'all'
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        subscriptions(
          plan_id,
          status,
          current_period_end
        )
      `, { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,user_id.eq.${search}`);
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) throw error;

    // Get ban status for each user
    const userIds = users?.map(u => u.user_id) || [];
    const { data: bans } = await supabase
      .from('user_bans')
      .select('user_id, reason, is_permanent, expires_at')
      .in('user_id', userIds)
      .eq('is_active', true);

    const banMap = new Map(bans?.map(b => [b.user_id, b]));

    // Get message counts
    const { data: messageCounts } = await supabase
      .from('chats')
      .select('user_id, messages(count)')
      .in('user_id', userIds);

    const messageCountMap = new Map<string, number>();
    messageCounts?.forEach((c: { user_id: string; messages: { count: number }[] }) => {
      const currentCount = messageCountMap.get(c.user_id) || 0;
      messageCountMap.set(c.user_id, currentCount + (c.messages?.[0]?.count || 0));
    });

    // Format response
    const formattedUsers = users?.map(user => {
      const ban = banMap.get(user.user_id);
      const subscription = user.subscriptions?.[0];

      return {
        id: user.id,
        user_id: user.user_id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        subscription_tier: subscription?.plan_id || 'free',
        subscription_status: subscription?.status || null,
        subscription_end: subscription?.current_period_end || null,
        total_messages: messageCountMap.get(user.user_id) || 0,
        is_banned: !!ban,
        ban_reason: ban?.reason || null,
        ban_expires: ban?.expires_at || null,
        is_permanent_ban: ban?.is_permanent || false,
      };
    });

    // Filter by status if specified
    let filteredUsers = formattedUsers;
    if (status === 'banned') {
      filteredUsers = formattedUsers?.filter(u => u.is_banned);
    } else if (status === 'active') {
      filteredUsers = formattedUsers?.filter(u => !u.is_banned);
    }

    return NextResponse.json({
      users: filteredUsers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
