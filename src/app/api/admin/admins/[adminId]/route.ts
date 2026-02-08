import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check owner access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminData || adminData.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  }

  const body = await request.json();
  const { role, is_active } = body;

  try {
    // Get target admin
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', adminId)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Cannot modify owner
    if (targetAdmin.role === 'owner') {
      return NextResponse.json({ error: 'Cannot modify owner' }, { status: 400 });
    }

    // Cannot promote to owner
    if (role === 'owner') {
      return NextResponse.json({ error: 'Cannot promote to owner' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', adminId);

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: user.id,
      p_action: 'update',
      p_resource_type: 'admin',
      p_resource_id: adminId,
      p_details: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check owner access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!adminData || adminData.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  }

  try {
    // Get target admin
    const { data: targetAdmin } = await supabase
      .from('admin_users')
      .select('role, user_id')
      .eq('id', adminId)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Cannot delete owner
    if (targetAdmin.role === 'owner') {
      return NextResponse.json({ error: 'Cannot delete owner' }, { status: 400 });
    }

    // Cannot delete self
    if (targetAdmin.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: user.id,
      p_action: 'delete',
      p_resource_type: 'admin',
      p_resource_id: adminId,
      p_details: { deleted_admin_id: adminId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
