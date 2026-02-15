export interface SearchResult {
  title: string
  url: string
  description: string
  engine?: string
}

export interface WebSearchResponse {
  results: SearchResult[]
  query: string
  searchTime: number
}

const SEARXNG_URL = process.env.SEARXNG_URL || ''
const MAX_RESULTS = 5
const TIMEOUT_MS = 8000

/**
 * Search the web via self-hosted SearXNG instance.
 * Returns empty results gracefully if SearXNG is unavailable.
 */
export async function searchWeb(query: string, count: number = MAX_RESULTS): Promise<WebSearchResponse> {
  if (!SEARXNG_URL) {
    return { results: [], query, searchTime: 0 }
  }

  const startTime = Date.now()

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      categories: 'general',
      language: 'th-TH',
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(`${SEARXNG_URL}/search?${params}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`SearXNG returned ${response.status}`)
      return { results: [], query, searchTime: 0 }
    }

    const data = await response.json()
    const searchTime = (Date.now() - startTime) / 1000

    // Deduplicate by URL and pick top results
    const seen = new Set<string>()
    const results: SearchResult[] = []

    for (const item of data.results || []) {
      if (results.length >= count) break
      const url = item.url as string
      if (!url || seen.has(url)) continue
      seen.add(url)

      results.push({
        title: (item.title as string) || url,
        url,
        description: (item.content as string) || '',
        engine: item.engine as string | undefined,
      })
    }

    return { results, query, searchTime }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('SearXNG request timed out')
    } else {
      console.error('SearXNG search failed:', error)
    }
    return { results: [], query, searchTime: 0 }
  }
}

/**
 * Format search results as system message context for the AI.
 */
export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return ''

  const lines = results.map((r, i) =>
    `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`
  )

  return [
    'ผลการค้นหาจากเว็บ (ใช้ข้อมูลนี้ประกอบการตอบ อ้างอิงแหล่งที่มาเมื่อเหมาะสม):',
    '',
    ...lines,
  ].join('\n')
}

/**
 * Format search results as a marker to append to saved messages.
 * This marker is parsed by the frontend to render a sources block.
 */
export function formatSourcesMarker(results: SearchResult[]): string {
  if (results.length === 0) return ''

  const sources = results.map(r =>
    JSON.stringify({ title: r.title, url: r.url, description: r.description })
  )

  return `\n\n[WEB_SOURCES]\n${sources.join('\n')}\n[/WEB_SOURCES]`
}
