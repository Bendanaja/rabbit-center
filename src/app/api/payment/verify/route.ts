import { getUserFromRequest } from '@/lib/supabase/auth-helper'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySlipByBase64 } from '@/lib/thunder'
import { checkRateLimit, getRateLimitKey, RATE_LIMITS, applyRateLimitHeaders } from '@/lib/rate-limit'
import { validateContentType, validateInput, INPUT_LIMITS } from '@/lib/security'
import { PRICING_PLANS } from '@/lib/constants'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/payment/verify - Verify payment slip and activate subscription
export async function POST(request: Request) {
  const { user, error: authError } = await getUserFromRequest(request)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request, user.id, 'payment')
  const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.payment)
  if (!rateLimitResult.allowed) {
    const res = NextResponse.json(
      { error: 'กรุณารอสักครู่ก่อนลองใหม่' },
      { status: 429 }
    )
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  }

  // Content-Type validation
  const ctError = validateContentType(request)
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 })
  }

  const body = await request.json()
  const { imageBase64, planId } = body as {
    imageBase64?: string
    planId?: string
  }

  if (!imageBase64) {
    return NextResponse.json({ error: 'กรุณาอัปโหลดสลิปการโอนเงิน' }, { status: 400 })
  }

  if (!planId) {
    return NextResponse.json({ error: 'กรุณาเลือกแผนสมาชิก' }, { status: 400 })
  }

  // Validate image size
  const imgErr = validateInput(imageBase64, { type: 'string', maxLength: INPUT_LIMITS.imageBase64, fieldName: 'imageBase64' })
  if (imgErr) return NextResponse.json({ error: imgErr }, { status: 400 })

  // Look up plan price
  const plan = PRICING_PLANS.find(p => p.id === planId)
  if (!plan || plan.price <= 0) {
    return NextResponse.json({ error: 'แผนสมาชิกไม่ถูกต้อง' }, { status: 400 })
  }

  try {
    // Verify slip with Thunder API
    const result = await verifySlipByBase64(imageBase64, {
      checkDuplicate: true,
    })

    if (!result.success || !result.data) {
      const res = NextResponse.json(
        { success: false, error: result.error || 'การตรวจสอบสลิปล้มเหลว' },
        { status: 400 }
      )
      applyRateLimitHeaders(res.headers, rateLimitResult)
      return res
    }

    // Check duplicate
    if (result.data.isDuplicate) {
      return NextResponse.json(
        { success: false, error: 'สลิปนี้เคยถูกใช้แล้ว กรุณาใช้สลิปใหม่' },
        { status: 400 }
      )
    }

    // Validate receiver - check company name
    const receiverName = result.data.receiver.accountName || ''
    if (!receiverName.includes('แรบบิท')) {
      return NextResponse.json(
        { success: false, error: 'สลิปนี้ไม่ใช่การโอนเงินไปยังบัญชีของเรา กรุณาตรวจสอบบัญชีปลายทาง' },
        { status: 400 }
      )
    }

    // Check amount >= plan price
    if (result.data.amount < plan.price) {
      return NextResponse.json(
        { success: false, error: `จำนวนเงินในสลิป (${result.data.amount} บาท) ไม่ถึงราคาแผน ${plan.name} (${plan.price} บาท)` },
        { status: 400 }
      )
    }

    // All checks passed - update database
    const supabase = createAdminClient()
    const now = new Date().toISOString()
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Record payment transaction
    const { error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        amount: result.data.amount,
        plan_id: planId,
        payment_method: 'bank_transfer',
        transaction_ref: result.data.transRef,
        status: 'completed',
        verified_at: now,
      })

    if (txError) {
      console.error('Failed to record payment transaction:', txError)
      return NextResponse.json(
        { success: false, error: 'บันทึกรายการชำระเงินล้มเหลว กรุณาติดต่อฝ่ายสนับสนุน' },
        { status: 500 }
      )
    }

    // Update subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: now,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        updated_at: now,
      }, { onConflict: 'user_id' })

    if (subError) {
      console.error('Failed to update subscription:', subError)
      return NextResponse.json(
        { success: false, error: 'อัปเดตสมาชิกภาพล้มเหลว กรุณาติดต่อฝ่ายสนับสนุน' },
        { status: 500 }
      )
    }

    const res = NextResponse.json({
      success: true,
      data: {
        transactionId: result.data.transRef,
        amount: result.data.amount,
        planId,
        planName: plan.name,
        sender: {
          name: result.data.sender.accountName,
          bank: result.data.sender.bankName,
        },
        receiver: {
          name: result.data.receiver.accountName,
          bank: result.data.receiver.bankName,
        },
        periodEnd,
      },
    })
    applyRateLimitHeaders(res.headers, rateLimitResult)
    return res
  } catch (error) {
    console.error('Payment verification error:', error)
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
