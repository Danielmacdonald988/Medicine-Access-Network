// Only coarse, allowlisted signals. Never pass form values, URLs or profile IDs.
export const ENGAGEMENT_EVENTS = ['visit', 'directory_view', 'profile_view', 'resource_view', 'search_used', 'search_empty', 'signup_view', 'signup_started', 'signup_accepted', 'signup_error', 'application_started', 'application_step', 'application_submitted', 'application_error', 'contact_started', 'contact_sent', 'contact_error', 'direct_contact', 'guide_saved'] as const
export type EngagementEvent = typeof ENGAGEMENT_EVENTS[number]
export const SOURCES = ['direct', 'instagram', 'tiktok', 'x', 'youtube', 'linktree', 'search', 'other'] as const
export const DEVICES = ['mobile', 'tablet', 'desktop'] as const
export const APPLICATION_STEPS = ['Display name', 'Location', 'Remote sessions', 'Practice introduction', 'Modalities', 'Experience', 'Training', 'Safety practices', 'Contraindications', 'Compensation', 'Rates', 'Photos', 'Contact links', 'Agreement']

export function pageEvent(path: string): EngagementEvent | null {
  if (path === '/signup') return 'signup_view'
  if (path === '/' || path === '/facilitators' || path === '/integration-support') return 'directory_view'
  if (/^\/facilitators\/[^/]+$/.test(path)) return 'profile_view'
  if (path === '/resources' || path === '/psychedelic-facilitator' || /^\/resources\/[^/]+$/.test(path)) return 'resource_view'
  return null
}

export function trafficSource(referrer: string, ownHost: string): typeof SOURCES[number] {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (host === ownHost.replace(/^www\./, '')) return 'direct'
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram'
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok'
    if (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com') || host === 't.co') return 'x'
    if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube'
    if (host === 'linktr.ee') return 'linktree'
    if (/^(www\.)?(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com)$/.test(host)) return 'search'
    return 'other'
  } catch { return 'direct' }
}
