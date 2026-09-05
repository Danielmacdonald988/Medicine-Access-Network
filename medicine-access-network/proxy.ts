import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Seekers no longer have accounts — browse/search/filter/facilitator-detail
// pages are fully public and intentionally NOT listed here (see the SEO
// migration notes: they need to be crawlable, and running an auth/cookie
// exchange on every crawler hit is wasted work). Only routes that still
// require a session are matched below; see `config.matcher`.
//
// '/seeker' is gone entirely (see the seeker-account-removal migration) —
// no route exists there anymore, so there's nothing left to protect.
const PROTECTED_PREFIXES = ['/dashboard', '/facilitator', '/admin', '/onboarding']
const AUTH_ONLY_PATHS = ['/login', '/signup', '/forgot-password']

// Security headers used to be set here on every matched response. They now
// live in next.config.ts's `headers()` — that applies them to ALL routes,
// including the public ones this middleware no longer runs on, without
// paying for a middleware invocation (and a Supabase auth round-trip) on
// every request. See next.config.ts.

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() must be called on every request to refresh the session token.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    const redirectPath = request.nextUrl.searchParams.get('next') ?? '/dashboard'
    const safeRedirect =
      redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/dashboard'
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = safeRedirect
    dashUrl.search = ''
    return NextResponse.redirect(dashUrl)
  }

  return supabaseResponse
}

// Explicit allowlist, not a "run everywhere except assets" blanket matcher
// — this is the point of this migration's middleware change. Browse,
// search, filter, and facilitator-detail pages (and everything else not
// listed) never invoke this function at all.
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/facilitator',
    '/facilitator/:path*',
    '/admin',
    '/admin/:path*',
    '/onboarding',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
}
