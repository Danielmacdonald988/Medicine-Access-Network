import type { NextConfig } from 'next'
import { validateEnv } from './lib/env'

validateEnv()

const privateRoutes = ['api', 'admin', 'dashboard', 'facilitator', 'onboarding', 'auth', 'login', 'signup', 'forgot-password', 'update-password']

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: __dirname },

  // Moved out of proxy.ts: these used to be set in middleware, which meant
  // every request paid for a middleware invocation (Supabase cookie
  // exchange included) just to get security headers. Config-level headers
  // apply to every route — including the now-public, crawlable
  // browse/search/facilitator-detail pages — without that cost. See
  // proxy.ts for the auth-gated routes that still need real middleware.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Content-Security-Policy',
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
          },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      ...privateRoutes.map((route) => ({
        source: `/${route}/:path*`,
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      })),
      ...(process.env.VERCEL_ENV === 'preview' ? [{
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      }] : []),
    ]
  },
}

export default nextConfig
