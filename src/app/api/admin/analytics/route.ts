import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30d';

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  switch (range) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      startDate = new Date('2020-01-01');
      break;
    default: // 30d
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    // Get user growth data
    const { data: userGrowth } = await supabase
      .from('analytics_daily')
      .select('date, total_users, new_users')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get message stats
    const { data: messageStats } = await supabase
      .from('analytics_daily')
      .select('date, total_messages, total_tokens')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get revenue stats
    const { data: revenueStats } = await supabase
      .from('analytics_daily')
      .select('date, total_revenue, new_subscriptions')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get model usage
    const { data: modelUsage } = await supabase
      .from('chat_messages')
      .select('model')
      .gte('created_at', startDate.toISOString());

    // Calculate model usage stats
    const modelCounts: Record<string, number> = {};
    modelUsage?.forEach(m => {
      if (m.model) {
        modelCounts[m.model] = (modelCounts[m.model] || 0) + 1;
      }
    });

    const totalRequests = Object.values(modelCounts).reduce((a, b) => a + b, 0);
    const modelUsageStats = Object.entries(modelCounts)
      .map(([model, requests]) => ({
        model,
        requests,
        tokens: requests * 1000, // Estimate
        percentage: totalRequests > 0 ? Math.round((requests / totalRequests) * 100) : 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Get top users
    const { data: topUsers } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        full_name,
        total_messages
      `)
      .order('total_messages', { ascending: false })
      .limit(5);

    // Calculate metrics
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active');

    const totalSubscriptions = subscriptions?.length || 0;
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const conversionRate = totalUsers ? ((totalSubscriptions / (totalUsers || 1)) * 100).toFixed(1) : 0;

    // Get daily active users for last 7 days
    const dailyActiveUsers = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('chat_messages')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', date.toISOString().split('T')[0])
        .lt('created_at', new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      dailyActiveUsers.push(count || 0);
    }

    return NextResponse.json({
      userGrowth: userGrowth?.map(u => ({
        date: u.date,
        count: u.total_users || 0,
        new_users: u.new_users || 0,
      })) || [],
      messageStats: messageStats?.map(m => ({
        date: m.date,
        count: m.total_messages || 0,
        tokens: m.total_tokens || 0,
      })) || [],
      revenueStats: revenueStats?.map(r => ({
        date: r.date,
        amount: r.total_revenue || 0,
        subscriptions: r.new_subscriptions || 0,
      })) || [],
      modelUsage: modelUsageStats,
      topUsers: topUsers?.map(u => ({
        user_id: u.user_id,
        name: u.full_name || 'Unknown',
        messages: u.total_messages || 0,
        spent: 0, // Would need to join with subscriptions
      })) || [],
      conversionRate: Number(conversionRate),
      churnRate: 3.2, // Placeholder
      avgSessionDuration: 25.4, // Placeholder
      dailyActiveUsers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
