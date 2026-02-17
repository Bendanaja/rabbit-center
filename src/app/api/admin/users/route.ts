import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { sanitizeSearchQuery } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify admin access
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const { data: adminData } = await adminSupabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'banned', 'all'
    const allowedSortFields = ['created_at', 'updated_at', 'display_name'];
    const sortBy = allowedSortFields.includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'created_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('user_profiles')
      .select(`
        user_id,
        display_name,
        avatar_url,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Search filter (sanitize to prevent injection via PostgREST operators)
    if (search) {
      const safeSearch = sanitizeSearchQuery(search);
      query = query.or(`display_name.ilike.%${safeSearch}%,user_id.eq.${safeSearch}`);
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) throw error;

    // Get user IDs for parallel lookups
    const userIds = users?.map(u => u.user_id) || [];

    if (userIds.length === 0) {
      return NextResponse.json({
        users: [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // Run all lookups in parallel
    const [subsResult, bansResult, messageCountsResult] = await Promise.all([
      // Subscriptions
      supabase
        .from('subscriptions')
        .select('user_id, plan_id, status, current_period_end')
        .in('user_id', userIds),

      // Ban status
      supabase
        .from('user_bans')
        .select('user_id, reason, is_permanent, expires_at')
        .in('user_id', userIds)
        .eq('is_active', true),

      // Message counts
      supabase
        .from('chats')
        .select('user_id, messages(count)')
        .in('user_id', userIds),
    ]);

    const subMap = new Map(subsResult.data?.map(s => [s.user_id, s]));
    const banMap = new Map(bansResult.data?.map(b => [b.user_id, b]));

    const messageCountMap = new Map<string, number>();
    messageCountsResult.data?.forEach((c: { user_id: string; messages: { count: number }[] }) => {
      const currentCount = messageCountMap.get(c.user_id) || 0;
      messageCountMap.set(c.user_id, currentCount + (c.messages?.[0]?.count || 0));
    });

    // Format response
    const formattedUsers = users?.map(user => {
      const ban = banMap.get(user.user_id);
      const subscription = subMap.get(user.user_id);

      return {
        id: user.user_id,
        user_id: user.user_id,
        full_name: user.display_name,
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
