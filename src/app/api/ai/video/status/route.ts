import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { checkVideoStatus } from '@/lib/byteplus'
import { validateInput, INPUT_LIMITS } from '@/lib/security'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ai/video/status?taskId=xxx - Check video generation status
export async function GET(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate taskId length
    const taskIdErr = validateInput(taskId, { type: 'string', maxLength: INPUT_LIMITS.taskId, fieldName: 'taskId' })
    if (taskIdErr) {
      return NextResponse.json({ error: taskIdErr }, { status: 400 })
    }

    const result = await checkVideoStatus(taskId)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status check failed'
    console.error('Video status check error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
