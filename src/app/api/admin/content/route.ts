import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { getPageContent, setPageContent, type PageName } from '@/lib/content'

export const dynamic = 'force-dynamic'

const VALID_PAGES: PageName[] = ['about', 'features', 'pricing', 'footer']

// GET /api/admin/content?page=about
export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminData) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') as PageName | null

  if (page && !VALID_PAGES.includes(page)) {
    return NextResponse.json({ error: 'Invalid page name' }, { status: 400 })
  }

  try {
    if (page) {
      const content = await getPageContent(page)
      return NextResponse.json({ page, content })
    }

    // Return all pages
    const allContent: Record<string, unknown> = {}
    for (const p of VALID_PAGES) {
      allContent[p] = await getPageContent(p)
    }
    return NextResponse.json({ pages: allContent })
  } catch (error) {
    console.error('Get content error:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}

// PUT /api/admin/content
export async function PUT(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: adminData } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminData || !['owner', 'admin'].includes(adminData.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { page, content } = body as { page: PageName; content: unknown }

    if (!page || !VALID_PAGES.includes(page)) {
      return NextResponse.json({ error: 'Invalid page name' }, { status: 400 })
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Content object is required' }, { status: 400 })
    }

    await setPageContent(page, content as never, user.id)

    // Log activity
    try {
      await supabase.rpc('log_admin_activity', {
        p_admin_user_id: user.id,
        p_action: 'update_page_content',
        p_resource_type: 'page_content',
        p_resource_id: page,
        p_details: { page },
      })
    } catch {
      // non-critical
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update content error:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}
