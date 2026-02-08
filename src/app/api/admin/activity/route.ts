import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin access - only owners can see all activity
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
  const limit = parseInt(searchParams.get('limit') || '30');
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || 'all';
  const resource = searchParams.get('resource') || 'all';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('admin_activity_log')
      .select(`
        *,
        admin:admin_users!admin_user_id (
          role,
          user_profile:user_profiles!user_id (
            full_name,
            avatar_url
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action !== 'all') {
      query = query.eq('action', action);
    }

    if (resource !== 'all') {
      query = query.eq('resource_type', resource);
    }

    // Non-owners can only see their own activity
    if (adminData.role !== 'owner') {
      query = query.eq('admin_user_id', user.id);
    }

    const { data: activities, count, error } = await query;

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      activities: activities?.map(activity => ({
        id: activity.id,
        admin_user_id: activity.admin_user_id,
        admin_name: activity.admin?.user_profile?.full_name || 'Unknown',
        admin_avatar: activity.admin?.user_profile?.avatar_url || null,
        admin_role: activity.admin?.role || 'unknown',
        action: activity.action,
        resource_type: activity.resource_type,
        resource_id: activity.resource_id,
        details: activity.details,
        ip_address: activity.ip_address,
        user_agent: activity.user_agent,
        created_at: activity.created_at,
      })) || [],
      total: count || 0,
      totalPages,
      page,
    });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
