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

// Get read/dismiss stats for a specific broadcast
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch broadcast info and notification stats in parallel
    const [broadcastResult, notificationsResult] = await Promise.all([
      supabase
        .from('broadcasts')
        .select('id, title, message, type, target_plan, is_active, expires_at, created_by, created_at')
        .eq('id', id)
        .single(),
      supabase
        .from('user_notifications')
        .select('is_read, is_dismissed')
        .eq('broadcast_id', id),
    ]);

    if (broadcastResult.error) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    const notifications = notificationsResult.data || [];
    let total_read = 0;
    let total_dismissed = 0;

    for (const n of notifications) {
      if (n.is_read) total_read++;
      if (n.is_dismissed) total_dismissed++;
    }

    return NextResponse.json({
      broadcast: broadcastResult.data,
      total_read,
      total_dismissed,
      total_notifications: notifications.length,
    });
  } catch (error) {
    console.error('Broadcast stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch broadcast stats' },
      { status: 500 }
    );
  }
}
