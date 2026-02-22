import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { flowGetJob, flowCancelJob } from '@/lib/flow-api'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params

  if (!jobId || jobId.length > 100) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
  }

  try {
    const job = await flowGetJob(jobId)
    return NextResponse.json(job)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get job'
    console.error('Studios get job error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params

  if (!jobId || jobId.length > 100) {
    return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 })
  }

  try {
    const job = await flowCancelJob(jobId)
    return NextResponse.json(job)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel job'
    console.error('Studios cancel job error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
