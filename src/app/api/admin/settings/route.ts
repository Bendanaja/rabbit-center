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

// Get all settings
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('system_config')
      .select('*')
      .order('category')
      .order('key');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category
    const grouped: Record<string, typeof data> = {};
    data?.forEach(config => {
      if (!grouped[config.category]) {
        grouped[config.category] = [];
      }
      grouped[config.category].push(config);
    });

    return NextResponse.json({
      settings: data,
      grouped,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update multiple settings
export async function PUT(request: NextRequest) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();

    const { settings } = body;
    const adminUserId = auth.user.id;

    // Update each setting
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key,
          value: JSON.stringify(value),
          updated_by: adminUserId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    });

    await Promise.all(updates);

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: adminUserId,
      p_action: 'update_settings',
      p_resource_type: 'system_config',
      p_resource_id: null,
      p_details: { keys: Object.keys(settings) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
