// Flow API Client Library (server-side only)
// Proxies requests to bot.rabbithub.ai for Studios creative workspace

const FLOW_BASE = 'https://bot.rabbithub.ai'
const FLOW_API_KEY = process.env.FLOW_API_KEY

export type FlowMode = 'image' | 'video' | 'frame_to_video' | 'video_mix'
export type FlowStatus = 'queued' | 'generating' | 'downloading' | 'completed' | 'failed' | 'cancelled'

export interface FlowJobResponse {
  job_id: string
  status: FlowStatus
  prompt: string
  mode: FlowMode
  model?: string
  aspect_ratio?: string
  result_file?: string
  download_url?: string
  error?: string
  created_at: string
  updated_at: string
}

export interface FlowGenerateParams {
  prompt: string
  mode: FlowMode
  model?: string
  aspect_ratio?: string
  image_url?: string
  end_image_url?: string
}

export const FLOW_IMAGE_MODELS = [
  { id: 'Imagen 4', name: 'Imagen 4', provider: 'Google' },
  { id: 'Nano Banana', name: 'Nano Banana', provider: 'Google' },
  { id: 'Nano Banana Pro', name: 'Nano Banana Pro', provider: 'Google' },
]

export const FLOW_VIDEO_MODELS = [
  { id: 'Veo 3.1 - Fast', name: 'Veo 3.1 Fast', provider: 'Google' },
  { id: 'Veo 3.1 - Quality', name: 'Veo 3.1 Quality', provider: 'Google' },
  { id: 'Veo 2 - Fast', name: 'Veo 2 Fast', provider: 'Google' },
  { id: 'Veo 2 - Quality', name: 'Veo 2 Quality', provider: 'Google' },
]

function getHeaders(): Record<string, string> {
  if (!FLOW_API_KEY) {
    throw new Error('FLOW_API_KEY is not configured')
  }
  return {
    'Content-Type': 'application/json',
    'X-API-Key': FLOW_API_KEY,
  }
}

export async function flowGenerate(params: FlowGenerateParams): Promise<FlowJobResponse> {
  const response = await fetch(`${FLOW_BASE}/bot/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || err.error || `Flow API error: ${response.status}`)
  }

  return response.json()
}

export async function flowGetJob(jobId: string): Promise<FlowJobResponse> {
  const response = await fetch(`${FLOW_BASE}/bot/jobs/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || err.error || `Flow API error: ${response.status}`)
  }

  return response.json()
}

export async function flowListJobs(): Promise<FlowJobResponse[]> {
  const response = await fetch(`${FLOW_BASE}/bot/jobs`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || err.error || `Flow API error: ${response.status}`)
  }

  return response.json()
}

export async function flowCancelJob(jobId: string): Promise<FlowJobResponse> {
  const response = await fetch(`${FLOW_BASE}/bot/jobs/${jobId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || err.error || `Flow API error: ${response.status}`)
  }

  return response.json()
}
