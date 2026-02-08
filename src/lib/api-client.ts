// API client helper that includes auth token in requests

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    const authData = localStorage.getItem('rabbithub-auth')
    if (!authData) return null

    const parsed = JSON.parse(authData)
    return parsed?.access_token || null
  } catch {
    return null
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken()

  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
