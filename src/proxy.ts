import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/jwt'
import { SESSION_COOKIE } from '@/lib/auth/session'

const EDITOR_ONLY_PATHS = [/^\/bulk(\/|$)/, /^\/edit(\/|$)/]

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 100

const globalForRateLimit = globalThis as unknown as {
  rateLimitHits?: Map<string, { count: number; resetAt: number }>
}

const hits =
  globalForRateLimit.rateLimitHits ??
  new Map<string, { count: number; resetAt: number }>()

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.rateLimitHits = hits
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429 },
      )
    }

    return NextResponse.next()
  }

  if (EDITOR_ONLY_PATHS.some((pattern) => pattern.test(pathname))) {
    const session = await verifySession(
      request.cookies.get(SESSION_COOKIE)?.value,
    )

    if (session?.role !== 'editor') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/bulk/:path*', '/edit/:path*', '/api/:path*'],
}
