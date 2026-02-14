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
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const plan = searchParams.get('plan') || 'all';
  const status = searchParams.get('status') || 'all';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('user_subscriptions')
      .select(`
        *,
        user:user_profiles!user_id (
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plan !== 'all') {
      query = query.eq('tier', plan);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      // Sanitize search to prevent PostgREST operator injection
      const safeSearch = search.replace(/[%_\\]/g, '\\$&').slice(0, 200);
      query = query.or(`user_id.ilike.%${safeSearch}%`);
    }

    const { data: subscriptions, count, error } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      subscriptions: subscriptions?.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_name: sub.user?.full_name || 'Unknown',
        user_email: '', // Would need email from auth
        user_avatar: sub.user?.avatar_url || null,
        plan: sub.tier,
        status: sub.status,
        amount: sub.tier === 'premium' ? 799 : sub.tier === 'pro' ? 499 : sub.tier === 'starter' ? 199 : 0,
        currency: 'THB',
        interval: 'monthly',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        created_at: sub.created_at,
        cancelled_at: sub.cancelled_at,
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
