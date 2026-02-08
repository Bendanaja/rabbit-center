import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  const { flagId } = await params;
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

  const body = await request.json();
  const { action, notes } = body;

  try {
    // Get the flag first
    const { data: flag } = await supabase
      .from('flagged_chats')
      .select('*')
      .eq('id', flagId)
      .single();

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found' }, { status: 404 });
    }

    // Update flag status
    const { error: updateError } = await supabase
      .from('flagged_chats')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'action_taken',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        action_notes: notes,
      })
      .eq('id', flagId);

    if (updateError) throw updateError;

    // If action is ban, ban the user
    if (action === 'ban') {
      const { error: banError } = await supabase
        .from('user_bans')
        .insert({
          user_id: flag.user_id,
          banned_by: user.id,
          reason: notes || 'Flagged content violation',
          is_permanent: true,
        });

      if (banError) throw banError;

      // Update user profile
      await supabase
        .from('user_profiles')
        .update({ is_banned: true })
        .eq('user_id', flag.user_id);
    }

    // Log the action
    await supabase.from('admin_activity_log').insert({
      admin_user_id: user.id,
      action: action === 'dismiss' ? 'update' : action,
      resource_type: 'moderation',
      resource_id: flagId,
      details: { action, notes, user_id: flag.user_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Moderation action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
