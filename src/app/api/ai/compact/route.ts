import { chatCompletion, COMPACT_MODEL } from '@/lib/byteplus'
import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/compact - Summarize old messages for context compaction
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { messages } = body as {
    messages: { role: string; content: string }[]
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  try {
    // Format conversation for summarization
    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    const { content } = await chatCompletion(
      [
        {
          role: 'system',
          content:
            'สรุปบทสนทนาต่อไปนี้ให้กระชับ เก็บข้อมูลสำคัญ การตัดสินใจ ความต้องการของผู้ใช้ และบริบทที่จำเป็นสำหรับการสนทนาต่อ ตอบเป็นภาษาเดียวกับบทสนทนา สรุปไม่เกิน 300 คำ',
        },
        {
          role: 'user',
          content: conversation,
        },
      ],
      COMPACT_MODEL
    )

    return NextResponse.json({ summary: content })
  } catch (err) {
    console.error('Compact error:', err)
    return NextResponse.json(
      { error: 'Failed to compact messages' },
      { status: 500 }
    )
  }
}
