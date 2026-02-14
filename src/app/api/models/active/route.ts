import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Public endpoint: returns list of disabled model IDs
// so the model selector can hide them
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('ai_models')
      .select('model_id, is_active')

    const disabledModels = data
      ?.filter(m => m.is_active === false)
      .map(m => m.model_id) || []

    return NextResponse.json({ disabledModels }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch {
    return NextResponse.json({ disabledModels: [] })
  }
}
