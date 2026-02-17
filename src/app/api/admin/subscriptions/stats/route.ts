import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check admin access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan_id, status, created_at, canceled_at');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate stats
    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;

    const newThisMonth = subscriptions?.filter(s =>
      new Date(s.created_at) >= thisMonthStart
    ).length || 0;

    const churnedThisMonth = subscriptions?.filter(s =>
      s.canceled_at && new Date(s.canceled_at) >= thisMonthStart
    ).length || 0;

    // Calculate MRR
    const planPrices: Record<string, number> = {
      free: 0,
      starter: 199,
      pro: 499,
      premium: 799,
    };

    const mrr = subscriptions?.reduce((sum, sub) => {
      if (sub.status === 'active') {
        return sum + (planPrices[sub.plan_id] || 0);
      }
      return sum;
    }, 0) || 0;

    // Plan breakdown from subscriptions table
    const planCounts: Record<string, number> = {};
    subscriptions?.forEach(sub => {
      if (!planCounts[sub.plan_id]) planCounts[sub.plan_id] = 0;
      planCounts[sub.plan_id]++;
    });

    const planBreakdown = [
      {
        plan: 'Premium',
        count: planCounts['premium'] || 0,
        revenue: (planCounts['premium'] || 0) * 799
      },
      {
        plan: 'Pro',
        count: planCounts['pro'] || 0,
        revenue: (planCounts['pro'] || 0) * 499
      },
      {
        plan: 'Starter',
        count: planCounts['starter'] || 0,
        revenue: (planCounts['starter'] || 0) * 199
      },
      {
        plan: 'Free',
        count: planCounts['free'] || 0,
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
