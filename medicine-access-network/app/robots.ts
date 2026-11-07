import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      // Permit rendering of visible profile photos. The image route still enforces
      // profile visibility and sends noindex; all other APIs remain excluded.
      allow: ['/', '/api/profile-images/'],
      disallow: [
        '/api/',
        '/admin',
        '/dashboard',
        '/seeker',
        '/facilitator$',
        '/facilitator/',
        '/onboarding/',
        '/login',
        '/signup',
        '/saved',
        '/forgot-password',
        '/update-password',
        '/auth/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
