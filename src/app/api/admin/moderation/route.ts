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
  const status = searchParams.get('status') || 'pending';

  try {
    let query = supabase
      .from('flagged_chats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: flags, error } = await query;

    if (error) throw error;

    // Fetch related chats and user profiles in parallel
    const chatIds = [...new Set(flags?.map(f => f.chat_id) || [])];
    const flaggedByIds = [...new Set(flags?.map(f => f.flagged_by).filter(Boolean) || [])];

    const [chatsResult, profilesResult] = await Promise.all([
      chatIds.length > 0
        ? supabase.from('chats').select('id, user_id, title').in('id', chatIds)
        : { data: [] },
      flaggedByIds.length > 0
        ? supabase.from('user_profiles').select('user_id, display_name, avatar_url').in('user_id', flaggedByIds)
        : { data: [] },
    ]);

    const chatsMap = Object.fromEntries(
      (chatsResult.data || []).map(c => [c.id, c])
    );

    // Also get chat owner profiles
    const chatOwnerIds = [...new Set((chatsResult.data || []).map(c => c.user_id))];
    let ownerProfilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
    if (chatOwnerIds.length > 0) {
      const { data: ownerProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', chatOwnerIds);
      ownerProfilesMap = Object.fromEntries(
        (ownerProfiles || []).map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );
    }

    return NextResponse.json(flags?.map(flag => {
      const chat = chatsMap[flag.chat_id];
      const chatOwner = chat ? ownerProfilesMap[chat.user_id] : null;
      return {
        id: flag.id,
        chat_id: flag.chat_id,
        user_id: chat?.user_id || flag.flagged_by || '',
        user_name: chatOwner?.display_name || 'Unknown',
        user_avatar: chatOwner?.avatar_url || null,
        reason: flag.reason || '',
        severity: 'medium',
        status: flag.status,
        flagged_content: flag.details || flag.reason || '',
        flagged_at: flag.created_at,
        reviewed_by: flag.reviewed_by,
        reviewed_at: flag.reviewed_at,
        action_notes: flag.reviewer_notes,
      };
    }) || []);
  } catch (error) {
    console.error('Moderation fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }
}
