import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const { data: adminData } = await adminSupabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Get distinct users who have chats, with their chat counts and last activity
    const { data, error } = await supabase
      .from('chats')
      .select(`
        user_id,
        user_profiles (
          display_name,
          avatar_url
        )
      `);

    if (error) throw error;

    // Aggregate per user
    const userMap = new Map<string, {
      user_id: string;
      display_name: string | null;
      avatar_url: string | null;
      chat_count: number;
    }>();

    for (const chat of data || []) {
      const uid = chat.user_id as string;
      const existing = userMap.get(uid);
      if (existing) {
        existing.chat_count++;
      } else {
        const profileRaw = chat.user_profiles;
        const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { display_name: string; avatar_url: string } | null;
        userMap.set(uid, {
          user_id: uid,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          chat_count: 1,
        });
      }
    }

    // Sort by chat count descending
    const users = Array.from(userMap.values()).sort((a, b) => b.chat_count - a.chat_count);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin chat users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat users' },
      { status: 500 }
    );
  }
}
