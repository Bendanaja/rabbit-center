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

  // Check admin access - only owners can see all activity
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
  const limit = parseInt(searchParams.get('limit') || '30');
  const action = searchParams.get('action') || 'all';
  const resource = searchParams.get('resource') || 'all';

  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('admin_activity_log')
      .select('*', { count: 'exact' })
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

    // Fetch admin profiles separately
    const adminUserIds = [...new Set((activities || []).map(a => a.admin_user_id))];
    let adminProfilesMap: Record<string, { display_name: string | null; avatar_url: string | null; role: string }> = {};

    if (adminUserIds.length > 0) {
      // Get admin roles
      const { data: admins } = await supabase
        .from('admin_users')
        .select('user_id, role')
        .in('user_id', adminUserIds);

      // Get profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', adminUserIds);

      const adminRolesMap = Object.fromEntries(
        (admins || []).map(a => [a.user_id, a.role])
      );
      const profileMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, p])
      );

      for (const uid of adminUserIds) {
        adminProfilesMap[uid] = {
          display_name: profileMap[uid]?.display_name || null,
          avatar_url: profileMap[uid]?.avatar_url || null,
          role: adminRolesMap[uid] || 'unknown',
        };
      }
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      activities: (activities || []).map(activity => ({
        id: activity.id,
        admin_user_id: activity.admin_user_id,
        admin_name: adminProfilesMap[activity.admin_user_id]?.display_name || 'Unknown',
        admin_avatar: adminProfilesMap[activity.admin_user_id]?.avatar_url || null,
        admin_role: adminProfilesMap[activity.admin_user_id]?.role || 'unknown',
        action: activity.action,
        resource_type: activity.resource_type,
        resource_id: activity.resource_id,
        details: activity.details,
        ip_address: activity.ip_address,
        user_agent: activity.user_agent,
        created_at: activity.created_at,
      })),
      total: count || 0,
      totalPages,
      page,
    });
  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
