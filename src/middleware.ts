import { NextResponse, type NextRequest } from 'next/server'

// Simplified middleware - auth is handled client-side via localStorage
// since Supabase URL is on a different domain (cross-origin cookie issues)
export async function middleware(request: NextRequest) {
  // Just pass through all requests - auth is handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
