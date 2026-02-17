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

// Update broadcast
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { title, message, type, target_plan, action_url, action_label, is_active, expires_at } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (title.length > 255) {
        return NextResponse.json({ error: 'Title must be 255 characters or less' }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (message !== undefined) {
      if (typeof message !== 'string' || message.trim().length === 0) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }
      if (message.length > 2000) {
        return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 });
      }
      updateData.message = message.trim();
    }

    if (type !== undefined) {
      const validTypes = ['info', 'warning', 'critical', 'success', 'promotional'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Type must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    if (target_plan !== undefined) {
      const validPlans = ['free', 'starter', 'pro', 'premium'];
      if (target_plan !== null && !validPlans.includes(target_plan)) {
        return NextResponse.json(
          { error: `target_plan must be null or one of: ${validPlans.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.target_plan = target_plan;
    }

    if (action_url !== undefined) updateData.action_url = action_url;

    if (action_label !== undefined) {
      if (action_label && typeof action_label === 'string' && action_label.length > 100) {
        return NextResponse.json({ error: 'Action label must be 100 characters or less' }, { status: 400 });
      }
      updateData.action_label = action_label;
    }

    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data, error } = await supabase
      .from('broadcasts')
      .update(updateData)
      .eq('id', id)
      .select('id, title, message, type, target_plan, action_url, action_label, is_active, expires_at, created_by, created_at, updated_at')
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: auth.user.id,
      p_action: 'update_broadcast',
      p_resource_type: 'broadcast',
      p_resource_id: id,
      p_details: { updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Update broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to update broadcast' },
      { status: 500 }
    );
  }
}

// Soft delete broadcast (set is_active=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin'].includes(auth.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('broadcasts')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, is_active, updated_at')
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
    }

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: auth.user.id,
      p_action: 'delete_broadcast',
      p_resource_type: 'broadcast',
      p_resource_id: id,
      p_details: { soft_delete: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to delete broadcast' },
      { status: 500 }
    );
  }
}
