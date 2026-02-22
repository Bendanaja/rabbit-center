import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';
import { sanitizeSearchQuery } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify admin access
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
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const search = searchParams.get('search') || '';
    const userId = searchParams.get('userId') || '';
    const allowedSortFields = ['updated_at', 'created_at', 'message_count'];
    const sortBy = allowedSortFields.includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'updated_at';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const modelId = searchParams.get('modelId') || '';
    const offset = (page - 1) * limit;

    // If searching, also find users matching by display_name
    let matchedUserIds: string[] = [];
    if (search) {
      const safeSearch = sanitizeSearchQuery(search);
      const { data: matchedUsers } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('display_name', `%${safeSearch}%`)
        .limit(50);
      matchedUserIds = matchedUsers?.map(u => u.id) || [];
    }

    // Build query
    let query = supabase
      .from('chats')
      .select(`
        id,
        title,
        user_id,
        model_id,
        message_count,
        last_message_at,
        created_at,
        updated_at,
        user_profiles (
          display_name,
          avatar_url
        )
      `, { count: 'exact' });

    // Filter by specific user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Search filter (search by chat title OR user display name)
    if (search) {
      const safeSearch = sanitizeSearchQuery(search);
      if (matchedUserIds.length > 0) {
        query = query.or(`title.ilike.%${safeSearch}%,user_id.in.(${matchedUserIds.join(',')})`);
      } else {
        query = query.ilike('title', `%${safeSearch}%`);
      }
    }

    // Filter by model
    if (modelId) {
      query = query.eq('model_id', modelId);
    }

    // Sort and paginate
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    query = query.range(offset, offset + limit - 1);

    const { data: chats, error, count } = await query;

    if (error) throw error;

    const total = count || 0;

    const formattedChats = chats?.map((chat: Record<string, unknown>) => {
      const profileRaw = chat.user_profiles;
      const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { display_name: string; avatar_url: string } | null;
      return {
        id: chat.id,
        title: chat.title,
        user_id: chat.user_id,
        model_id: chat.model_id,
        message_count: chat.message_count,
        last_message_at: chat.last_message_at,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        user_display_name: profile?.display_name || null,
        user_avatar_url: profile?.avatar_url || null,
      };
    }) || [];

    return NextResponse.json({
      chats: formattedChats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin chats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
