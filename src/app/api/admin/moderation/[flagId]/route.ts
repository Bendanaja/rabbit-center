import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const { flagId } = await params;
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

  const body = await request.json();
  const { action, notes } = body;

  try {
    // Get the flag first
    const { data: flag } = await supabase
      .from('flagged_chats')
      .select('*, chats:chat_id(user_id)')
      .eq('id', flagId)
      .single();

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Map action to valid flag_status enum: 'pending', 'reviewed', 'approved', 'rejected'
    const statusMap: Record<string, string> = {
      dismiss: 'rejected',
      approve: 'approved',
      ban: 'reviewed',
      warn: 'reviewed',
    };

    // Update flag status - use reviewer_notes (not action_notes)
    const { error: updateError } = await supabase
      .from('flagged_chats')
      .update({
        status: statusMap[action] || 'reviewed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes,
      })
      .eq('id', flagId);

    if (updateError) throw updateError;

    // If action is ban, ban the chat owner
    if (action === 'ban') {
      // Get user_id from the related chat
      const chatUserId = flag.chats?.user_id || flag.flagged_by;

      if (chatUserId) {
        const { error: banError } = await supabase
          .from('user_bans')
          .insert({
            user_id: chatUserId,
            banned_by: user.id,
            reason: notes || 'Flagged content violation',
            is_permanent: true,
            is_active: true,
          });

        if (banError) throw banError;
      }
    }

    // Log the action
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: user.id,
      p_action: action === 'dismiss' ? 'update' : action,
      p_resource_type: 'moderation',
      p_resource_id: flagId,
      p_details: { action, notes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
