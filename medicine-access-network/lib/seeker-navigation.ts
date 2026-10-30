import { boundedInteger, directoryHref, filterSearchParams, parseFacilitatorFilters, type FacilitatorFilters } from './facilitator-search'
import { profileSupportOptions } from './contact-options'

export const INTEGRATION_SERVICE = 'Integration conversations'

/** Keep return navigation on known discovery routes; never accept an arbitrary URL. */
export function discoveryReturnHref(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2000 || !value.startsWith('/') || value.startsWith('//')) return null
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null
  try {
    const url = new URL(value, 'https://navigation.invalid')
    if (url.origin !== 'https://navigation.invalid' || url.hash) return null
    // Compare the raw path too: reject encoded, dot-segment or slash-normalized alternatives.
    const path = value.split('?', 1)[0]
    if (path !== url.pathname) return null
    if (path === '/integration-support') return url.search ? null : path
    if (path !== '/facilitators') return null
    const params = filterSearchParams(parseFacilitatorFilters(url.searchParams))
    const page = boundedInteger(url.searchParams.get('page'), 1, 1, 10000)
    if (page > 1) params.set('page', String(page))
    return directoryHref(params)
  } catch { return null }
}

/** Carry intent only from an explicit, single integration-service filter. */
export function directorySupportIntent(filters: FacilitatorFilters): string | undefined {
  return filters.modalities.length === 1 && filters.modalities[0] === INTEGRATION_SERVICE ? INTEGRATION_SERVICE : undefined
}

export function profileDiscoveryHref(id: string, returnTo?: string, service?: string): string {
  const params = new URLSearchParams()
  const safeReturn = discoveryReturnHref(returnTo)
  if (safeReturn) params.set('returnTo', safeReturn)
  if (service === INTEGRATION_SERVICE) params.set('service', INTEGRATION_SERVICE)
  const query = params.toString()
  return `/facilitators/${encodeURIComponent(id)}${query ? `?${query}` : ''}`
}

/** A hint is never a new service claim. Bare/unsupported profile visits stay blank. */
export function initialSupportSelection(service: unknown, modalities: readonly string[]): string {
  return service === INTEGRATION_SERVICE && profileSupportOptions(modalities).includes(INTEGRATION_SERVICE)
    ? INTEGRATION_SERVICE : ''
}
