import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

// GET /api/user/notifications - Fetch notifications for the logged-in user
export async function GET(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    // Step 1: Get user's subscription plan
    const { data: profileData } = await supabase
      .from('customer_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    // Step 2: Default to 'free' if not found
    const userPlan = profileData?.subscription_tier || 'free';

    // Step 3: Query active broadcasts targeted at this user's plan
    const now = new Date().toISOString();
    const { data: broadcasts, error: broadcastError } = await supabase
      .from('broadcasts')
      .select('id, title, message, type, target_plan, action_url, action_label, created_at, expires_at')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + now)
      .or('target_plan.is.null,target_plan.eq.' + userPlan)
      .order('created_at', { ascending: false })
      .limit(50);

    if (broadcastError) {
      return NextResponse.json({ error: broadcastError.message }, { status: 500 });
    }

    if (!broadcasts || broadcasts.length === 0) {
      return NextResponse.json([]);
    }

    // Step 4: Get user_notifications for these broadcasts
    const broadcastIds = broadcasts.map((b) => b.id);
    const { data: userNotifications, error: notifError } = await supabase
      .from('user_notifications')
      .select('broadcast_id, is_read, is_dismissed, read_at, dismissed_at')
      .eq('user_id', user.id)
      .in('broadcast_id', broadcastIds);

    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    // Step 5: Merge broadcast data with user notification status
    const notifMap = new Map(
      (userNotifications || []).map((n) => [n.broadcast_id, n])
    );

    const merged = broadcasts.map((broadcast) => {
      const userNotif = notifMap.get(broadcast.id);
      return {
        ...broadcast,
        is_read: userNotif?.is_read ?? false,
        is_dismissed: userNotif?.is_dismissed ?? false,
      };
    });

    // Step 6: Filter out dismissed notifications
    const result = merged.filter((n) => !n.is_dismissed);

    // Step 7: Return the array
    return NextResponse.json(result);
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
