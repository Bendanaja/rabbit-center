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

  // Check owner access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData || adminData.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  }

  try {
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, user_id, role, is_active, last_login_at, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch user profiles in parallel
    const userIds = admins?.map(a => a.user_id) || [];
    let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      profilesMap = Object.fromEntries(
        (profiles || []).map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );
    }

    return NextResponse.json(admins?.map(admin => ({
      ...admin,
      user_profile: profilesMap[admin.user_id] || { display_name: null, avatar_url: null },
    })) || []);
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getUserFromRequest(request);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check owner access
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!adminData || adminData.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
  }

  if (role === 'owner') {
    return NextResponse.json({ error: 'Cannot create owner role' }, { status: 400 });
  }

  try {
    // Find user by email from auth.users via admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) throw listError;

    const targetUser = users?.find(u => u.email === email);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', targetUser.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
    }

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: targetUser.id,
        role,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
