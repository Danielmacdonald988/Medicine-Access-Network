import type { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { resources } from '@/lib/resources'
import { SITE_URL } from '@/lib/constants'

// Covers every publicly indexable URL: static marketing/browse pages, the
// static resource articles, and every facilitator profile that's currently
// approved + public (queried the same way the browse/search pages do — see
// db/migrations/0002/0003 — so this can never list a profile that isn't
// actually reachable/visible).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServerSupabaseClient()

  const { data: facilitators } = await supabase
    .from('facilitator_public_profiles')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(50000) // Google's per-sitemap cap; split into multiple sitemaps if ever exceeded.

  const facilitatorEntries: MetadataRoute.Sitemap = (facilitators ?? []).map(
    (f) => ({
      url: `${SITE_URL}/facilitators/${f.id}`,
      lastModified: f.created_at,
      changeFrequency: 'weekly',
      priority: 0.7,
    }),
  )

  const resourceEntries: MetadataRoute.Sitemap = resources.map((r) => ({
    url: `${SITE_URL}/resources/${r.slug}`,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/facilitators`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/resources`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    { url: `${SITE_URL}/about` },
    { url: `${SITE_URL}/contact` },
    ...resourceEntries,
    ...facilitatorEntries,
  ]
}
