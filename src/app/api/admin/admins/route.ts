import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        last_login_at,
        created_at,
        user_profile:user_profiles!admin_users_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(admins || []);
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  const { email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
  }

  // Cannot create owner
  if (role === 'owner') {
    return NextResponse.json({ error: 'Cannot create owner role' }, { status: 400 });
  }

  try {
    // Find user by email from profiles
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already admin
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userProfile.user_id)
      .single();

    if (existingAdmin) {
      return NextResponse.json({ error: 'User is already an admin' }, { status: 400 });
    }

    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: userProfile.user_id,
        role,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_admin_activity', {
      p_admin_user_id: user.id,
      p_action: 'create',
      p_resource_type: 'admin',
      p_resource_id: newAdmin.id,
      p_details: { email, role },
    });

    return NextResponse.json(newAdmin);
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}
