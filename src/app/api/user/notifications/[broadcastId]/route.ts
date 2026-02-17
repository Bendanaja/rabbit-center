import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

// PATCH /api/user/notifications/[broadcastId] - Mark notification as read or dismiss
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ broadcastId: string }> }
) {
  const { broadcastId } = await params;
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { action } = body;

    // Validate action
    if (action !== 'read' && action !== 'dismiss') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "read" or "dismiss".' },
        { status: 400 }
      );
    }

    // Build upsert data
    const now = new Date().toISOString();
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      broadcast_id: broadcastId,
    };

    if (action === 'read') {
      upsertData.is_read = true;
      upsertData.read_at = now;
    } else if (action === 'dismiss') {
      upsertData.is_dismissed = true;
      upsertData.dismissed_at = now;
      upsertData.is_read = true;
      upsertData.read_at = now;
    }

    const { error: upsertError } = await supabase
      .from('user_notifications')
      .upsert(upsertData, { onConflict: 'user_id,broadcast_id' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
