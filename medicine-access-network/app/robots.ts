import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
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
        '/forgot-password',
        '/update-password',
        '/auth/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
