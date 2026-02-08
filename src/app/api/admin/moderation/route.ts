import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || 'pending';
  const severity = searchParams.get('severity') || 'all';
  const search = searchParams.get('search') || '';

  try {
    let query = supabase
      .from('flagged_chats')
      .select(`
        *,
        user:user_profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .order('flagged_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (severity !== 'all') {
      query = query.eq('severity', severity);
    }

    const { data: flags, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json(flags?.map(flag => ({
      id: flag.id,
      chat_id: flag.chat_id,
      user_id: flag.user_id,
      user_name: flag.user?.full_name || 'Unknown',
      user_avatar: flag.user?.avatar_url || null,
      reason: flag.reason,
      severity: flag.severity,
      status: flag.status,
      flagged_content: flag.flagged_content,
      flagged_at: flag.flagged_at,
      reviewed_by: flag.reviewed_by,
      reviewed_at: flag.reviewed_at,
      action_notes: flag.action_notes,
    })) || []);
  } catch (error) {
    console.error('Moderation fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
  }
}
