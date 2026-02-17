// Thunder Payment API client (v2)
// QR code generation (PromptPay) and slip verification

const THUNDER_QR_URL = 'https://bill-payment-api.thunder.in.th/'
const THUNDER_API_URL = 'https://api.thunder.in.th/v2'

// ─── Types ───────────────────────────────────────────────

export interface QRCodeParams {
  type: 'PROMPTPAY'
  msisdn?: string   // Thai mobile number (10 digits starting with 0)
  natId?: string     // Thai national ID or tax ID (13 digits)
  amount?: number
}

export interface QRCodeResponse {
  image_base64: string
  mime: string
  payload: string
}

export interface SlipVerificationResult {
  transRef: string
  date: string
  amount: number
  fee: number
  sender: {
    bankName: string
    bankShort: string
    accountName: string
    accountNameEn: string
    accountNumber: string
  }
  receiver: {
    bankName: string
    bankShort: string
    accountName: string
    accountNameEn: string
    accountNumber: string
  }
  isDuplicate?: boolean
}

export interface SlipVerificationResponse {
  success: boolean
  data?: SlipVerificationResult
  error?: string
  errorCode?: string
}

export interface AccountInfoResponse {
  quota: {
    used: number
    max: number | null
    remaining: number
    totalUsed: number
  }
  application: string
  product: string
}

// ─── Error Messages ──────────────────────────────────────

const THUNDER_ERROR_MESSAGES: Record<string, string> = {
  SLIP_PENDING: 'สลิปนี้ยังอยู่ระหว่างดำเนินการ กรุณารอ 5 นาทีแล้วลองใหม่',
  SLIP_NOT_FOUND: 'ไม่พบข้อมูลสลิปนี้ กรุณาตรวจสอบสลิปอีกครั้ง',
  IMAGE_SIZE_TOO_LARGE: 'ไฟล์รูปภาพมีขนาดใหญ่เกินไป กรุณาลดขนาดไฟล์',
  VALIDATION_ERROR: 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  DUPLICATE_SLIP: 'สลิปนี้เคยถูกใช้แล้ว',
  QUOTA_EXCEEDED: 'โควต้า API หมด กรุณาติดต่อผู้ดูแลระบบ',
}

function getThaiErrorMessage(code: string, fallback: string): string {
  return THUNDER_ERROR_MESSAGES[code] || fallback
}

// ─── Response Normalizer ─────────────────────────────────

interface ThunderV2RawResponse {
  success: boolean
  data?: {
    isDuplicate?: boolean
    amountInSlip: number
    rawSlip: {
      payload: string
      transRef: string
      date: string
      countryCode: string
      amount: { amount: number; local: { amount: number; currency: string } }
      fee: number
      ref1: string
      ref2: string
      ref3: string
      sender: {
        bank: { id: string; name: string; short: string }
        account: {
          name: { th: string; en: string }
          bank: { type: string; account: string }
        }
      }
      receiver: {
        bank: { id: string; name: string; short: string }
        account: {
          name: { th: string; en: string }
          bank: { type: string; account: string }
        }
        merchantId?: string
      }
    }
  }
  error?: { code: string; message: string }
  message?: string
}

function normalizeV2Response(raw: ThunderV2RawResponse): SlipVerificationResponse {
  if (!raw.success || !raw.data) {
    const code = raw.error?.code || 'UNKNOWN'
    const message = getThaiErrorMessage(code, raw.error?.message || 'การตรวจสอบสลิปล้มเหลว')
    return { success: false, error: message, errorCode: code }
  }

  const { rawSlip, isDuplicate } = raw.data

  return {
    success: true,
    data: {
      transRef: rawSlip.transRef,
      date: rawSlip.date,
      amount: rawSlip.amount.amount,
      fee: rawSlip.fee,
      sender: {
        bankName: rawSlip.sender.bank.name,
        bankShort: rawSlip.sender.bank.short,
        accountName: rawSlip.sender.account.name.th,
        accountNameEn: rawSlip.sender.account.name.en,
        accountNumber: rawSlip.sender.account.bank.account,
      },
      receiver: {
        bankName: rawSlip.receiver.bank.name,
        bankShort: rawSlip.receiver.bank.short,
        accountName: rawSlip.receiver.account.name.th,
        accountNameEn: rawSlip.receiver.account.name.en,
        accountNumber: rawSlip.receiver.account.bank.account,
      },
      isDuplicate,
    },
  }
}

// ─── QR Code Generation (no auth needed) ─────────────────

export async function generatePromptPayQR(params: QRCodeParams): Promise<QRCodeResponse> {
  if (!params.msisdn && !params.natId) {
    throw new Error('Either msisdn or natId is required')
  }

  if (params.msisdn && !/^0\d{9}$/.test(params.msisdn)) {
    throw new Error('msisdn must be a 10-digit Thai mobile number starting with 0')
  }

  if (params.natId && !/^\d{13}$/.test(params.natId)) {
    throw new Error('natId must be a 13-digit Thai national/tax ID')
  }

  if (params.amount != null && params.amount <= 0) {
    throw new Error('amount must be a positive number')
  }

  const body: Record<string, unknown> = { type: params.type }
  if (params.msisdn) body.msisdn = params.msisdn
  if (params.natId) body.natId = params.natId
  if (params.amount != null) body.amount = params.amount

  const response = await fetch(THUNDER_QR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `QR generation failed: ${response.status}`)
  }

  return response.json()
}

// ─── Slip Verification (needs auth) ──────────────────────

export async function verifySlipByBase64(
  base64: string,
  options?: { matchAmount?: number; checkDuplicate?: boolean }
): Promise<SlipVerificationResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  // Ensure base64 has data URI prefix
  const b64 = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`

  const body: Record<string, unknown> = { base64: b64 }
  if (options?.matchAmount != null) body.matchAmount = options.matchAmount
  if (options?.checkDuplicate != null) body.checkDuplicate = String(options.checkDuplicate)

  const response = await fetch(`${THUNDER_API_URL}/verify/bank`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'RabbitHub/1.0',
    },
    body: JSON.stringify(body),
  })

  const raw: ThunderV2RawResponse = await response.json().catch(() => ({
    success: false,
    error: { code: 'PARSE_ERROR', message: `HTTP ${response.status}` },
  }))

  return normalizeV2Response(raw)
}

export async function verifySlipByPayload(
  payload: string,
  options?: { matchAmount?: number; checkDuplicate?: boolean }
): Promise<SlipVerificationResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  const body: Record<string, unknown> = { payload }
  if (options?.matchAmount != null) body.matchAmount = options.matchAmount
  if (options?.checkDuplicate != null) body.checkDuplicate = String(options.checkDuplicate)

  const response = await fetch(`${THUNDER_API_URL}/verify/bank`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'RabbitHub/1.0',
    },
    body: JSON.stringify(body),
  })

  const raw: ThunderV2RawResponse = await response.json().catch(() => ({
    success: false,
    error: { code: 'PARSE_ERROR', message: `HTTP ${response.status}` },
  }))

  return normalizeV2Response(raw)
}

// ─── Account Info ────────────────────────────────────────

export async function getAccountInfo(): Promise<AccountInfoResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  const response = await fetch(`${THUNDER_API_URL}/info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'RabbitHub/1.0',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Account info failed: ${response.status}`)
  }

  const raw = await response.json()
  return {
    quota: raw.data.application.quota,
    application: raw.data.application.name,
    product: raw.data.product.name,
  }
}
