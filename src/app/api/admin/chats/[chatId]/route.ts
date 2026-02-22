import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
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
    const { chatId } = await params;
    const supabase = createAdminClient();

    // Fetch chat details and messages in parallel
    const [chatResult, messagesResult] = await Promise.all([
      supabase
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
          is_archived,
          user_profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('id', chatId)
        .single(),
      supabase
        .from('messages')
        .select(`
          id,
          role,
          content,
          model_id,
          tokens_input,
          tokens_output,
          response_time_ms,
          is_error,
          error_message,
          metadata,
          created_at
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true }),
    ]);

    if (chatResult.error) {
      if (chatResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      throw chatResult.error;
    }

    if (messagesResult.error) throw messagesResult.error;

    // Server-side content parsing: extract images, videos, web sources from markers
    // and return as structured fields so the frontend doesn't need regex parsing.
    const messages = (messagesResult.data || []).map((msg: Record<string, unknown>) => {
      let content = msg.content as string || '';
      const images: string[] = [];
      const videos: string[] = [];
      const webSources: { title: string; url: string }[] = [];

      // Extract images
      content = content.replace(
        /\[GENERATED_IMAGE\]\n?([\s\S]*?)\n?\[\/GENERATED_IMAGE\]/g,
        (_, block: string) => {
          const urls = block.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const url of urls) {
            if (url.startsWith('data:')) {
              // Remaining base64 — skip display, just note it
              images.push('');
            } else {
              images.push(url);
            }
          }
          return '';
        }
      );

      // Extract videos
      content = content.replace(
        /\[GENERATED_VIDEO\]\n?([\s\S]*?)\n?\[\/GENERATED_VIDEO\]/g,
        (_, block: string) => {
          const urls = block.split('\n').map((l: string) => l.trim()).filter(Boolean);
          videos.push(...urls.filter((u: string) => !u.startsWith('data:')));
          return '';
        }
      );

      // Extract web sources
      content = content.replace(
        /\[WEB_SOURCES\]\n?([\s\S]*?)\n?\[\/WEB_SOURCES\]/g,
        (_, block: string) => {
          const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.title && parsed.url) {
                webSources.push({ title: parsed.title, url: parsed.url });
              }
            } catch { /* skip */ }
          }
          return '';
        }
      );

      const cleanContent = content.trim();
      const filteredImages = images.filter(Boolean);

      return {
        ...msg,
        content: cleanContent,
        ...(filteredImages.length > 0 && { images: filteredImages }),
        ...(videos.length > 0 && { videos }),
        ...(webSources.length > 0 && { webSources }),
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chat = chatResult.data as any;
    const profileRaw = chat.user_profiles;
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { display_name: string; avatar_url: string } | null;

    // Get user email from auth.users via admin client
    const { data: authUser } = await supabase.auth.admin.getUserById(chat.user_id);

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        user_id: chat.user_id,
        model_id: chat.model_id,
        message_count: chat.message_count,
        last_message_at: chat.last_message_at,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        is_archived: chat.is_archived,
      },
      messages,
      user: {
        display_name: profile?.display_name || null,
        avatar_url: profile?.avatar_url || null,
        email: authUser?.user?.email || null,
      },
    });
  } catch (error) {
    console.error('Admin chat detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat details' },
      { status: 500 }
    );
  }
}
