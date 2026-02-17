import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Run ALL queries in parallel for maximum speed
    const [
      usersResult,
      activeTodayResult,
      messagesResult,
      newUsersResult,
      activeSubsResult,
      pendingFlagsResult,
      revenueResult,
      modelUsageResult,
    ] = await Promise.all([
      // 1. Total users
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true }),

      // 2. Active users today
      supabase
        .from('messages')
        .select('chat:chats(user_id)')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`),

      // 3. Total messages
      supabase
        .from('messages')
        .select('*', { count: 'exact', head: true }),

      // 4. New users this week
      supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),

      // 5. Active subscriptions
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // 6. Pending flags
      supabase
        .from('flagged_chats')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // 7. Revenue
      supabase
        .from('payment_history')
        .select('amount')
        .eq('status', 'completed'),

      // 8. Model usage (last 7 days)
      supabase
        .from('usage_records')
        .select('model_id')
        .gte('date', weekAgo.toISOString().split('T')[0]),
    ]);

    // Process active users
    const uniqueActiveUsers = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeTodayResult.data?.map((m: any) => m.chat?.user_id || m.chat?.[0]?.user_id).filter(Boolean)
    );

    // Process revenue
    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Process model usage
    const modelUsage: Record<string, number> = {};
    modelUsageResult.data?.forEach((r: { model_id: string }) => {
      modelUsage[r.model_id] = (modelUsage[r.model_id] || 0) + 1;
    });

    const modelUsageArray = Object.entries(modelUsage)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalUsers: usersResult.count || 0,
      activeUsersToday: uniqueActiveUsers.size,
      totalMessages: messagesResult.count || 0,
      totalRevenue,
      newUsersThisWeek: newUsersResult.count || 0,
      activeSubscriptions: activeSubsResult.count || 0,
      pendingFlags: pendingFlagsResult.count || 0,
      modelUsage: modelUsageArray,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
