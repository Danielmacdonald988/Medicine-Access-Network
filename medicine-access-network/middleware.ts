import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require an authenticated session.
// Role enforcement is handled by layout-level requireRole() — middleware only
// checks that a valid session exists, which is cheaper than a DB role query.
const PROTECTED_PREFIXES = ['/dashboard', '/seeker', '/facilitator', '/admin', '/onboarding']

// Routes that should redirect authenticated users away (auth pages).
const AUTH_ONLY_PATHS = ['/login', '/signup', '/forgot-password']

// Routes that are explicitly public — no session needed, no redirect.
// Listed here for documentation; they are already excluded by PROTECTED_PREFIXES.
// const PUBLIC_PREFIXES = ['/', '/facilitators', '/resources', '/about']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // IMPORTANT: getUser() must be called on every request to refresh the session token.
  // Do not remove or skip this — it is critical for SSR auth to work correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated visitors away from protected routes.
  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth-only pages back to their dashboard.
  if (user && AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    const redirectPath = request.nextUrl.searchParams.get('next') ?? '/dashboard'
    // Validate the next param — only allow same-origin relative paths.
    const safeRedirect =
      redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/dashboard'
    const dashUrl = request.nextUrl.clone()
    dashUrl.pathname = safeRedirect
    dashUrl.search = ''
    return NextResponse.redirect(dashUrl)
  }

  // Security headers on all responses.
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
