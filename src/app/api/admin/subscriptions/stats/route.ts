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

  try {
    // Get active subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, status, created_at, cancelled_at');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate stats
    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;

    const newThisMonth = subscriptions?.filter(s =>
      new Date(s.created_at) >= thisMonthStart
    ).length || 0;

    const churnedThisMonth = subscriptions?.filter(s =>
      s.cancelled_at && new Date(s.cancelled_at) >= thisMonthStart
    ).length || 0;

    // Calculate MRR
    const planPrices: Record<string, number> = {
      free: 0,
      pro: 299,
      enterprise: 1499,
    };

    const mrr = subscriptions?.reduce((sum, sub) => {
      if (sub.status === 'active') {
        return sum + (planPrices[sub.tier] || 0);
      }
      return sum;
    }, 0) || 0;

    // Plan breakdown
    const planCounts: Record<string, number> = {};
    subscriptions?.forEach(sub => {
      if (!planCounts[sub.tier]) planCounts[sub.tier] = 0;
      planCounts[sub.tier]++;
    });

    // Get free users count from profiles
    const { count: freeUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'free');

    const planBreakdown = [
      {
        plan: 'Enterprise',
        count: planCounts['enterprise'] || 0,
        revenue: (planCounts['enterprise'] || 0) * 1499
      },
      {
        plan: 'Pro',
        count: planCounts['pro'] || 0,
        revenue: (planCounts['pro'] || 0) * 299
      },
      {
        plan: 'Free',
        count: freeUsers || 0,
        revenue: 0
      },
    ];

    // Estimate total revenue (simplified)
    const totalRevenue = mrr * 12; // Annualized

    return NextResponse.json({
      totalRevenue,
      mrr,
      activeSubscriptions,
      churnedThisMonth,
      newThisMonth,
      planBreakdown,
    });
  } catch (error) {
    console.error('Subscription stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
