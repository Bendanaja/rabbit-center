import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { flowListJobs } from '@/lib/flow-api'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await flowListJobs()
    return NextResponse.json(jobs)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list jobs'
    console.error('Studios list jobs error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
