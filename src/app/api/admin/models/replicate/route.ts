import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth-helper';

export const dynamic = 'force-dynamic';

// GET /api/admin/models/replicate?q=search_term
// Search Replicate's model catalog for image/video generation models
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

  const searchQuery = request.nextUrl.searchParams.get('q') || '';

  try {
    const { searchReplicateModels } = await import('@/lib/replicate');
    const { models, total } = await searchReplicateModels(searchQuery);

    // Get existing model IDs in our DB to mark duplicates
    const { data: existing } = await supabase
      .from('ai_models')
      .select('id');
    const existingIds = new Set((existing || []).map(m => m.id));

    const results = models.slice(0, 100).map(m => ({
      id: m.id,
      name: m.name,
      owner: m.owner,
      description: m.description,
      run_count: m.run_count,
      cover_image_url: m.cover_image_url,
      model_type: m.model_type,
      already_added: existingIds.has(m.id),
    }));

    return NextResponse.json({ models: results, total });
  } catch (error) {
    console.error('Replicate search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Replicate models' },
      { status: 500 }
    );
  }
}
