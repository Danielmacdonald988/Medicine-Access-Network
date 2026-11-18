import { directoryHref, filterSearchParams, type FacilitatorFilters } from './facilitator-search'

/** Offer an explicit choice, never infer substance-administration services. */
export function facilitatorSearchRecovery(filters: FacilitatorFilters, page: number) {
  const term = filters.q.toLowerCase().trim().replace(/\s+/g, ' ')
  if (page !== 1 || !/^psychedelic facilitators?$/.test(term)) return []

  return [
    { service: 'Preparation education', label: 'Browse preparation support' },
    { service: 'Integration conversations', label: 'Browse integration support' },
  ].map(({ service, label }) => {
    const params = filterSearchParams(filters)
    // Replace the broad phrase/service selection only after a visitor chooses
    // a link. Keep practical preferences and do not assume any availability.
    params.delete('q')
    params.delete('modality')
    params.set('modality', service)
    return { label, href: directoryHref(params) }
  })
}
