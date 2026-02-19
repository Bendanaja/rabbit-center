const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_KEY = process.env.CLOUDFLARE_API_KEY
const CF_EMAIL = process.env.CLOUDFLARE_EMAIL
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'rabbithub-images'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL

const R2_API_BASE = () =>
  `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects`

function getHeaders(): Record<string, string> {
  if (!CF_ACCOUNT_ID || !CF_API_KEY || !CF_EMAIL) {
    throw new Error('Cloudflare R2 credentials not configured')
  }
  return {
    'X-Auth-Email': CF_EMAIL,
    'X-Auth-Key': CF_API_KEY,
  }
}

export async function uploadImageToR2(
  base64Data: string,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  // Strip data URL prefix if present
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Clean, 'base64')

  const response = await fetch(`${R2_API_BASE()}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(),
      'Content-Type': contentType,
    },
    body: buffer,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`R2 upload failed: ${response.status} ${JSON.stringify(err)}`)
  }

  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  return `https://pub-91859bd8d5ff4000acee98cb9c5702d9.r2.dev/${key}`
}

/**
 * Upload generated base64 images to Cloudflare R2 and return public URLs.
 * Falls back to original base64 URLs if R2 is not configured or upload fails.
 */
export async function uploadGeneratedImages(
  imageUrls: string[],
  chatId: string
): Promise<string[]> {
  // Skip if R2 is not configured
  if (!CF_ACCOUNT_ID || !CF_API_KEY || !CF_EMAIL) {
    return imageUrls
  }

  const uploadedUrls: string[] = []
  const timestamp = Date.now()

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]

    // Only upload base64 data URLs, skip if already a remote URL
    if (!url.startsWith('data:')) {
      uploadedUrls.push(url)
      continue
    }

    const mimeMatch = url.match(/^data:(image\/\w+);base64,/)
    const contentType = mimeMatch?.[1] || 'image/jpeg'
    const ext = contentType.split('/')[1] || 'jpg'
    const key = `generated/${chatId}/${timestamp}-${i}.${ext}`

    try {
      const publicUrl = await uploadImageToR2(url, key, contentType)
      uploadedUrls.push(publicUrl)
      console.log(`[R2] Uploaded image ${i} (${(buffer_size(url) / 1024).toFixed(0)}KB) -> ${key}`)
    } catch (error) {
      console.error(`[R2] Failed to upload image ${i}:`, error)
      uploadedUrls.push(url) // Fallback to base64
    }
  }

  return uploadedUrls
}

function buffer_size(dataUrl: string): number {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
  return Math.ceil(base64.length * 0.75)
}
