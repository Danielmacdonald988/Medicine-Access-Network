import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

// Nothing was blocking crawlers before this file existed — there was no
// robots.txt at all (checked: no app/robots.ts/.txt, no noindex meta
// anywhere, no X-Robots-Tag header in proxy.ts or next.config.ts). This
// adds an explicit allow-by-default policy plus disallows for the routes
// that are gated behind a session anyway (see proxy.ts's PROTECTED_PREFIXES
// — a crawler hitting these gets bounced to /login, which isn't worth
// indexing even if it weren't disallowed here).
//
// Path patterns use `$` (end-of-string anchor) and trailing slashes
// deliberately, NOT bare prefixes — `Disallow: /facilitator` would also
// match `/facilitators`, the public browse/search/detail pages this
// migration exists to make crawlable. Same class of mistake as the old
// middleware matcher; avoided the same way here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/facilitator$',
        '/facilitator/',
        '/admin',
        '/admin/',
        '/onboarding/',
        '/login',
        '/signup',
        '/forgot-password',
        '/update-password',
        '/auth/',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
