import type { SupabaseClient } from '@supabase/supabase-js'
import { MODALITIES } from './constants'
import type { FacilitatorSearchResult } from './types'

export type DirectorySearchParams = Record<string, string | string[] | undefined>

export interface FacilitatorFilters {
  q: string
  location: string
  modalities: string[]
  remote: boolean
  donation: boolean
  minExperience: number
}

export const DIRECTORY_PAGE_SIZE = 18

export function toSearchParams(input: DirectorySearchParams): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, values] of Object.entries(input)) {
    for (const value of Array.isArray(values) ? values : values ? [values] : []) {
      params.append(key, value)
    }
  }
  return params
}

function cleanText(value: string | null, maxLength: number) {
  return (value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength)
}

export function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

export function parseFacilitatorFilters(params: Pick<URLSearchParams, 'get' | 'getAll'>): FacilitatorFilters {
  const modalities = params.getAll('modality').map((value) =>
    MODALITIES.find((modality) => modality.name.toLowerCase() === value.trim().toLowerCase())?.name
  ).filter((value): value is typeof MODALITIES[number]['name'] => Boolean(value))

  return {
    q: cleanText(params.get('q'), 120),
    location: cleanText(params.get('location'), 100),
    modalities: [...new Set(modalities)],
    remote: params.get('remote') === 'true',
    donation: params.get('donation') === 'true',
    minExperience: boundedInteger(params.get('min_exp'), 0, 0, 50),
  }
}

export function filterSearchParams(filters: FacilitatorFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.location) params.set('location', filters.location)
  filters.modalities.forEach((modality) => params.append('modality', modality))
  if (filters.remote) params.set('remote', 'true')
  if (filters.donation) params.set('donation', 'true')
  if (filters.minExperience) params.set('min_exp', String(filters.minExperience))
  return params
}

export function directoryHref(params: URLSearchParams): string {
  const query = params.toString()
  return `/facilitators${query ? `?${query}` : ''}`
}

export function hasActiveFilters(filters: FacilitatorFilters): boolean {
  return filterSearchParams(filters).size > 0
}

// Escape a literal substring for PostgreSQL's case-insensitive regex operator.
// Unlike ILIKE, this also preserves literal * and % characters in user input.
export function literalSearchPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// PostgREST OR expressions need their own quoting in addition to regex escaping.
function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function textSearchExpression(q: string): string {
  const value = quoteFilterValue(literalSearchPattern(q))
  const clauses = ['display_name', 'bio', 'location'].map((column) => `${column}.imatch.${value}`)
  const modalities = MODALITIES.filter((modality) => modality.name.toLowerCase().includes(q.toLowerCase()))
  if (modalities.length) {
    // Modality names come from the same catalog used by the application form.
    clauses.push(`modalities.ov.{${modalities.map((modality) => quoteFilterValue(modality.name)).join(',')}}`)
  }
  return clauses.join(',')
}

export function buildFacilitatorQuery(
  supabase: SupabaseClient,
  filters: FacilitatorFilters,
  { limit, offset, columns = '*' }: { limit: number; offset: number; columns?: string }
) {
  let query = supabase
    // The public view owns the approved + public visibility rule and excludes
    // internal workflow fields. Use it for logged-in visitors too.
    .from('facilitator_public_profiles')
    .select(columns, { count: 'exact' })

  if (filters.q) query = query.or(textSearchExpression(filters.q))
  if (filters.remote) query = query.eq('remote_available', true)
  if (filters.donation) query = query.eq('donation_based', true)
  if (filters.modalities.length) query = query.overlaps('modalities', filters.modalities)
  if (filters.location) query = query.regexIMatch('location', literalSearchPattern(filters.location))
  if (filters.minExperience) query = query.gte('years_experience', filters.minExperience)

  return query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)
}

export async function addFacilitatorRatings(
  supabase: SupabaseClient,
  facilitators: FacilitatorSearchResult[]
): Promise<FacilitatorSearchResult[]> {
  if (!facilitators.length) return facilitators

  try {
    // Reviews reference users.id, not facilitator_profiles.id. Keep this query
    // separate so unavailable reviews never hide the approved guide directory.
    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('facilitator_id, rating', { count: 'exact' })
      .in('facilitator_id', facilitators.map((facilitator) => facilitator.user_id))

    // Do not publish an average from a truncated result set.
    if (error || !reviews || count !== reviews.length) return facilitators

    return facilitators.map((facilitator) => {
      const ratings = reviews.filter((review) => review.facilitator_id === facilitator.user_id)
      return {
        ...facilitator,
        avg_rating: ratings.length ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length : undefined,
        review_count: ratings.length || undefined,
      }
    })
  } catch {
    return facilitators
  }
}
