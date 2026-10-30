import type { SupabaseClient } from '@supabase/supabase-js'
import { buildFacilitatorQuery, parseFacilitatorFilters } from './facilitator-search'
import type { FacilitatorSearchResult } from './types'

export const INTEGRATION_DIRECTORY_HREF = '/facilitators?modality=Integration+conversations'

// Use the directory's public projection and legacy-label mapping, never private
// application narratives or a frozen list of names/availability claims.
export async function loadIntegrationGuides(supabase: SupabaseClient) {
  const filters = parseFacilitatorFilters(new URLSearchParams({ modality: 'Integration conversations', sort: 'name' }))
  try {
    const { data, error, count } = await buildFacilitatorQuery(supabase, filters, { limit: 6, offset: 0 })
    if (error) return { status: 'unavailable' as const, guides: [], total: 0 }
    const guides = (data ?? []) as unknown as FacilitatorSearchResult[]
    return { status: 'ready' as const, guides, total: count ?? guides.length }
  } catch {
    return { status: 'unavailable' as const, guides: [], total: 0 }
  }
}
