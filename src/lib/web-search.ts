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
 * Use an AI model to autonomously decide whether the user's message needs a web search.
 */
export async function shouldAutoSearch(
  message: string,
  chatCompletionFn: (
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    model: string
  ) => Promise<{ content: string }>,
  model: string
): Promise<boolean> {
  // Skip very short messages (greetings, etc.)
  if (message.trim().length < 4) return false

  try {
    console.log(`[AutoSearch] Classifying: "${message}" with model: ${model}`)
    const { content } = await chatCompletionFn(
      [
        {
          role: 'system',
          content: `You are a search intent classifier. Given a user message, decide if it needs a web search to answer properly.

Answer ONLY "yes" or "no".

Say "yes" if the message:
- Asks about current events, prices, weather, news, scores, stock/crypto prices
- Asks about real-time or time-sensitive information (today, latest, current, etc.)
- Asks factual questions that need up-to-date data (release dates, schedules, etc.)
- Asks to look up specific information (addresses, phone numbers, reviews, etc.)
- References specific recent events, people in current news, or new products

Say "no" if the message:
- Is a greeting or casual conversation (สวัสดี, hi, thanks, etc.)
- Asks for creative writing, coding help, math, translation
- Asks general knowledge questions that don't need current data
- Is a follow-up or continuation of a conversation (ต่อ, อธิบายเพิ่ม, etc.)
- Asks for opinions, advice, or explanations of concepts`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model
    )

    const decision = content.trim().toLowerCase().startsWith('yes')
    console.log(`[AutoSearch] Model response: "${content.trim()}" → decision: ${decision}`)
    return decision
  } catch (err) {
    console.error('[AutoSearch] Classification FAILED:', err)
    return false
  }
}

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
