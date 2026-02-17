import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

// Verify admin access
async function verifyAdminAccess(request: Request) {
  const { user, error } = await getUserFromRequest(request);
  if (error || !user) return { authorized: false as const };

  const supabase = createAdminClient();
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) return { authorized: false as const };
  return { authorized: true as const, user, role: adminData.role as string };
}

// List broadcasts (paginated)
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || 'all';

  const offset = (page - 1) * limit;

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    let query = supabase
      .from('broadcasts')
      .select('id, title, message, type, target_plan, action_url, action_label, is_active, expires_at, created_by, created_at, updated_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'active') {
      query = query
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`);
    } else if (status === 'expired') {
      query = query.or(`is_active.eq.false,and(expires_at.not.is.null,expires_at.lte.${now})`);
    }

    const { data: broadcasts, count, error } = await query;

    if (error) throw error;

    // Compute active count separately
    const { count: activeCount } = await supabase
      .from('broadcasts')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    // Fetch read/dismiss counts for each broadcast
    const broadcastIds = broadcasts?.map(b => b.id) || [];
    let statsMap: Record<string, { read_count: number; dismiss_count: number }> = {};

    if (broadcastIds.length > 0) {
      const { data: notifications } = await supabase
        .from('user_notifications')
        .select('broadcast_id, is_read, is_dismissed')
        .in('broadcast_id', broadcastIds);

      if (notifications) {
        for (const n of notifications) {
          if (!statsMap[n.broadcast_id]) {
            statsMap[n.broadcast_id] = { read_count: 0, dismiss_count: 0 };
          }
          if (n.is_read) statsMap[n.broadcast_id].read_count++;
          if (n.is_dismissed) statsMap[n.broadcast_id].dismiss_count++;
        }
      }
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      broadcasts: (broadcasts || []).map(broadcast => ({
        ...broadcast,
        read_count: statsMap[broadcast.id]?.read_count || 0,
        dismiss_count: statsMap[broadcast.id]?.dismiss_count || 0,
      })),
      total: count || 0,
      active_count: activeCount || 0,
      totalPages,
      page,
    });
  } catch (error) {
    console.error('List broadcasts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcasts' },
      { status: 500 }
    );
  }
}

// Create new broadcast
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, message, type, target_plan, action_url, action_label, expires_at } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (title.length > 255) {
      return NextResponse.json({ error: 'Title must be 255 characters or less' }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 });
    }

    const validTypes = ['info', 'warning', 'critical', 'success', 'promotional'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPlans = ['free', 'starter', 'pro', 'premium'];
    if (target_plan !== null && target_plan !== undefined && !validPlans.includes(target_plan)) {
      return NextResponse.json(
        { error: `target_plan must be null or one of: ${validPlans.join(', ')}` },
        { status: 400 }
      );
    }

    if (action_label && typeof action_label === 'string' && action_label.length > 100) {
      return NextResponse.json({ error: 'Action label must be 100 characters or less' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('broadcasts')
      .insert({
        title: title.trim(),
        message: message.trim(),
        type,
        target_plan: target_plan || null,
        action_url: action_url || null,
        action_label: action_label || null,
        expires_at: expires_at || null,
        is_active: true,
        created_by: auth.user.id,
      })
      .select('id, title, message, type, target_plan, action_url, action_label, is_active, expires_at, created_by, created_at, updated_at')
      .single();

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: auth.user.id,
      p_action: 'create_broadcast',
      p_resource_type: 'broadcast',
      p_resource_id: data.id,
      p_details: { title: title.trim() },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to create broadcast' },
      { status: 500 }
    );
  }
}
