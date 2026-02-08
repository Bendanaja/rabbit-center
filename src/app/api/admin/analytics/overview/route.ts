import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users today (users who have messages today)
    const today = new Date().toISOString().split('T')[0];
    const { data: activeToday } = await supabase
      .from('messages')
      .select('chat:chats(user_id)')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    const uniqueActiveUsers = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeToday?.map((m: any) => m.chat?.user_id || m.chat?.[0]?.user_id).filter(Boolean)
    );

    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get pending flags
    const { count: pendingFlags } = await supabase
      .from('flagged_chats')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get total revenue
    const { data: revenueData } = await supabase
      .from('payment_history')
      .select('amount')
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    // Get model usage (last 7 days)
    const { data: modelUsageData } = await supabase
      .from('usage_records')
      .select('model_id')
      .gte('date', weekAgo.toISOString().split('T')[0]);

    const modelUsage: Record<string, number> = {};
    modelUsageData?.forEach((r: { model_id: string }) => {
      modelUsage[r.model_id] = (modelUsage[r.model_id] || 0) + 1;
    });

    const modelUsageArray = Object.entries(modelUsage)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsersToday: uniqueActiveUsers.size,
      totalMessages: totalMessages || 0,
      totalRevenue,
      newUsersThisWeek: newUsersThisWeek || 0,
      activeSubscriptions: activeSubscriptions || 0,
      pendingFlags: pendingFlags || 0,
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
