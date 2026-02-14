// Thunder Payment API client
// QR code generation (PromptPay) and slip verification

const THUNDER_QR_URL = 'https://bill-payment-api.thunder.in.th/'
const THUNDER_API_URL = 'https://api.thunder.in.th/v1'

// ─── Types ───────────────────────────────────────────────

export interface QRCodeParams {
  type: 'PROMPTPAY'
  msisdn?: string   // Thai mobile number (10 digits starting with 0)
  natId?: string     // Thai national ID (13 digits)
  amount?: number
}

export interface QRCodeResponse {
  image_base64: string
  mime: string
  payload: string
}

export interface SlipVerificationResponse {
  success: boolean
  data?: {
    transactionId: string
    date: string
    amount: number
    sender: {
      name: string
      bank: string
      account?: string
    }
    receiver: {
      name: string
      bank: string
      account?: string
    }
    [key: string]: unknown
  }
  error?: string
}

export interface AccountInfoResponse {
  quota: {
    used: number
    total: number
    remaining: number
  }
  [key: string]: unknown
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
    throw new Error('natId must be a 13-digit Thai national ID')
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

export async function verifySlip(
  payload: string,
  checkDuplicate = true
): Promise<SlipVerificationResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  const url = new URL(`${THUNDER_API_URL}/verify`)
  url.searchParams.set('payload', payload)
  url.searchParams.set('checkDuplicate', String(checkDuplicate))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Slip verification failed: ${response.status}`)
  }

  const data = await response.json()
  return { success: true, data }
}

export async function verifySlipByImage(imageBase64: string): Promise<SlipVerificationResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  const response = await fetch(`${THUNDER_API_URL}/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base64: imageBase64 }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Slip verification failed: ${response.status}`)
  }

  const data = await response.json()
  return { success: true, data }
}

// ─── Account Info ────────────────────────────────────────

export async function getAccountInfo(): Promise<AccountInfoResponse> {
  const apiKey = process.env.THUNDER_API_KEY
  if (!apiKey) throw new Error('Thunder API key not configured')

  const response = await fetch(`${THUNDER_API_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Account info failed: ${response.status}`)
  }

  return response.json()
}
