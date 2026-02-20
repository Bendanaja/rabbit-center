import { createAdminClient } from '@/lib/supabase/admin'
import { downloadAndUploadGeneratedImages, downloadAndUploadToR2 } from '@/lib/cloudflare-r2'

const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

// ─── Helpers ─────────────────────────────────────────────

function sizeToAspectRatio(size?: string): string {
  if (!size) return '1:1'
  const map: Record<string, string> = {
    '1024x1024': '1:1',
    '1024x768': '4:3',
    '768x1024': '3:4',
    '1024x576': '16:9',
    '576x1024': '9:16',
    '512x512': '1:1',
    '768x768': '1:1',
  }
  return map[size] || '1:1'
}

function sizeToWidthHeight(size?: string): { width: number; height: number } {
  if (!size) return { width: 1024, height: 1024 }
  const parts = size.split('x')
  if (parts.length === 2) {
    return { width: parseInt(parts[0]) || 1024, height: parseInt(parts[1]) || 1024 }
  }
  return { width: 1024, height: 1024 }
}

async function getReplicateToken(): Promise<string> {
  // Check env first
  if (process.env.REPLICATE_API_TOKEN) {
    return process.env.REPLICATE_API_TOKEN
  }

  // Fallback: query system_config table
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'REPLICATE_API_TOKEN')
    .single()

  if (data?.value) return data.value as string
  throw new Error('Replicate API token not configured')
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Image Generation (any Replicate image model) ────────

export async function generateImageReplicate(options: {
  prompt: string
  model?: string           // short key like 'flux-schnell' (unused for API call)
  replicateModelId: string // full ID like 'black-forest-labs/flux-schnell'
  size?: string
  n?: number
  chatId?: string
}): Promise<{ images: Array<{ url?: string; b64_json?: string }> }> {
  const token = await getReplicateToken()
  const { width, height } = sizeToWidthHeight(options.size)

  // Build input — send both formats so any model can pick what it supports
  const input: Record<string, unknown> = {
    prompt: options.prompt,
    aspect_ratio: sizeToAspectRatio(options.size),
    width,
    height,
    num_outputs: options.n || 1,
  }

  // Sync mode: wait up to 60s for result
  const response = await fetch(
    `${REPLICATE_BASE_URL}/models/${options.replicateModelId}/predictions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({ input }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as Record<string, unknown>)?.detail as string ||
      `Replicate API error: ${response.status}`
    )
  }

  let prediction = await response.json() as Record<string, unknown>

  // If 202 / still processing, poll until done
  if (prediction.status === 'starting' || prediction.status === 'processing') {
    const predictionId = prediction.id as string
    for (let i = 0; i < 60; i++) {
      await delay(2000)
      const pollRes = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!pollRes.ok) throw new Error(`Replicate poll failed: ${pollRes.status}`)
      prediction = await pollRes.json() as Record<string, unknown>
      if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
        break
      }
    }
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    throw new Error(
      (prediction.error as string) || 'Replicate image generation failed'
    )
  }

  // Output can be a single URL string or an array of URLs
  const rawOutput = prediction.output
  let outputUrls: string[]
  if (Array.isArray(rawOutput)) {
    outputUrls = rawOutput.filter((u): u is string => typeof u === 'string')
  } else if (typeof rawOutput === 'string') {
    outputUrls = [rawOutput]
  } else {
    throw new Error('Replicate returned no images')
  }

  if (outputUrls.length === 0) {
    throw new Error('Replicate returned no images')
  }

  // Download from Replicate (URLs expire in 1h) and re-upload to R2
  if (options.chatId) {
    const r2Urls = await downloadAndUploadGeneratedImages(outputUrls, options.chatId)
    return { images: r2Urls.map(url => ({ url })) }
  }

  return { images: outputUrls.map(url => ({ url })) }
}

// ─── Video Generation (any Replicate video model) ────────

export async function generateVideoReplicate(options: {
  prompt: string
  replicateModelId: string // full ID like 'minimax/video-01'
  duration?: number
  image_url?: string
}): Promise<{ taskId: string }> {
  const token = await getReplicateToken()

  const input: Record<string, unknown> = {
    prompt: options.prompt,
  }
  if (options.duration) input.duration = options.duration
  if (options.image_url) {
    input.image_url = options.image_url
    input.image = options.image_url  // some models use 'image' instead
  }

  // Async mode: no Prefer header (video takes too long)
  const response = await fetch(
    `${REPLICATE_BASE_URL}/models/${options.replicateModelId}/predictions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(
      (err as Record<string, unknown>)?.detail as string ||
      `Replicate API error: ${response.status}`
    )
  }

  const prediction = await response.json() as Record<string, unknown>
  return { taskId: `rep_${prediction.id}` }
}

// ─── Video Status Check ──────────────────────────────────

export async function checkVideoStatusReplicate(predictionId: string): Promise<{
  status: 'processing' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
}> {
  const token = await getReplicateToken()

  const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Replicate status check failed: ${response.status}`)
  }

  const prediction = await response.json() as Record<string, unknown>

  switch (prediction.status) {
    case 'succeeded': {
      const output = prediction.output as string | string[]
      const videoUrl = Array.isArray(output) ? output[0] : output
      // Download from Replicate and re-upload to R2
      if (videoUrl) {
        try {
          const ext = videoUrl.match(/\.(mp4|webm)(\?|$)/i)?.[1] || 'mp4'
          const key = `chats/replicate/generated/${Date.now()}-video.${ext}`
          const r2Url = await downloadAndUploadToR2(videoUrl, key, `video/${ext}`)
          return { status: 'completed', videoUrl: r2Url }
        } catch (error) {
          console.error('[Replicate] Failed to upload video to R2:', error)
          return { status: 'completed', videoUrl }
        }
      }
      return { status: 'completed' }
    }
    case 'failed':
    case 'canceled':
      return {
        status: 'failed',
        error: (prediction.error as string) || 'Video generation failed',
      }
    case 'starting':
    case 'processing':
    default:
      return { status: 'processing' }
  }
}

// ─── Fetch Replicate Collections (for auto-sync) ─────────

export interface ReplicateCollectionModel {
  owner: string
  name: string
  description: string
  run_count: number
  cover_image_url: string | null
  url: string
}

/**
 * Fetch all models from a Replicate curated collection.
 * Collections: text-to-image, image-to-image, text-to-video, image-to-video
 */
export async function fetchReplicateCollection(slug: string): Promise<ReplicateCollectionModel[]> {
  const token = await getReplicateToken()

  const response = await fetch(`${REPLICATE_BASE_URL}/collections/${slug}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    console.error(`[Replicate] Failed to fetch collection '${slug}': ${response.status}`)
    return []
  }

  const data = await response.json() as {
    models?: ReplicateCollectionModel[]
  }

  return data.models || []
}

// ─── Search Replicate Models (for admin UI) ──────────────

export interface ReplicateSearchResult {
  id: string           // 'owner/model'
  name: string
  owner: string
  description: string
  run_count: number
  cover_image_url: string | null
  model_type: 'image' | 'video'
}

export async function searchReplicateModels(query: string): Promise<{
  models: ReplicateSearchResult[]
  total: number
}> {
  const token = await getReplicateToken()

  // Search Replicate's model catalog
  const url = new URL(`${REPLICATE_BASE_URL}/models`)
  if (query) url.searchParams.set('query', query)

  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Replicate search failed: ${response.status}`)
  }

  const data = await response.json() as {
    results: Array<{
      owner: string
      name: string
      description: string
      run_count: number
      cover_image_url: string | null
      default_example?: {
        model: string
        input?: Record<string, unknown>
        output?: unknown
      }
      latest_version?: {
        openapi_schema?: {
          components?: {
            schemas?: {
              Output?: { type?: string; items?: { type?: string; format?: string } }
            }
          }
        }
      }
    }>
  }

  const results = (data.results || [])
    .map(m => {
      // Detect model type from output schema or description
      const desc = (m.description || '').toLowerCase()
      const outputSchema = m.latest_version?.openapi_schema?.components?.schemas?.Output
      const outputType = outputSchema?.type
      const itemFormat = outputSchema?.items?.format

      let modelType: 'image' | 'video' | null = null

      // Check output schema for type hints
      if (itemFormat === 'uri' && outputType === 'array') {
        // Could be image or video — check description
        if (desc.includes('video') || desc.includes('animate') || desc.includes('motion')) {
          modelType = 'video'
        } else {
          modelType = 'image'
        }
      }

      // Keyword detection from description
      if (!modelType) {
        const imageKeywords = ['text-to-image', 'image generation', 'generate image', 'img2img', 'image-to-image', 'diffusion', 'flux', 'stable diffusion', 'dall-e', 'sdxl', 'midjourney']
        const videoKeywords = ['text-to-video', 'video generation', 'generate video', 'image-to-video', 'animate', 'video model']

        if (videoKeywords.some(k => desc.includes(k))) modelType = 'video'
        else if (imageKeywords.some(k => desc.includes(k))) modelType = 'image'
      }

      if (!modelType) return null

      return {
        id: `${m.owner}/${m.name}`,
        name: m.name,
        owner: m.owner,
        description: m.description || '',
        run_count: m.run_count || 0,
        cover_image_url: m.cover_image_url || null,
        model_type: modelType,
      }
    })
    .filter((m): m is ReplicateSearchResult => m !== null)
    .sort((a, b) => b.run_count - a.run_count)

  return { models: results, total: results.length }
}
