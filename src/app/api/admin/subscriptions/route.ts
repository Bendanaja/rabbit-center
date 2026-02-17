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

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const plan = searchParams.get('plan') || 'all';
  const status = searchParams.get('status') || 'all';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plan !== 'all') {
      query = query.eq('plan_id', plan);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      const safeSearch = search.replace(/[%_\\]/g, '\\$&').slice(0, 200);
      query = query.or(`user_id.ilike.%${safeSearch}%`);
    }

    const { data: subscriptions, count, error } = await query;

    if (error) throw error;

    // Fetch user profiles for subscriptions in parallel
    const userIds = subscriptions?.map(s => s.user_id) || [];
    let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        profilesMap = Object.fromEntries(
          profiles.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
        );
      }
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      subscriptions: subscriptions?.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_name: profilesMap[sub.user_id]?.display_name || 'Unknown',
        user_email: '',
        user_avatar: profilesMap[sub.user_id]?.avatar_url || null,
        plan: sub.plan_id,
        status: sub.status,
        amount: sub.plan_id === 'premium' ? 799 : sub.plan_id === 'pro' ? 499 : sub.plan_id === 'starter' ? 199 : 0,
        currency: 'THB',
        interval: 'monthly',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        created_at: sub.created_at,
        cancelled_at: sub.canceled_at,
        stripe_subscription_id: sub.stripe_subscription_id,
      })) || [],
      total: count || 0,
      totalPages,
      page,
    });
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
