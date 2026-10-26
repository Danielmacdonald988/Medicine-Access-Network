import Link from 'next/link'
import { getTranslation } from '@/lib/i18n/server'
import { directoryHref, filterSearchParams, type FacilitatorFilters } from '@/lib/facilitator-search'

// Exact service selections observed in public listings, not inferred credentials
// or new provider categories. Keep the full catalogue in the existing filters.
const startingPoints = [
  ['Integration conversations', 'Integration'],
  ['Spiritual support', 'Spiritual support'],
  ['Somatic practices', 'Somatic practices'],
  ['Meditation & mindfulness', 'Meditation & Mindfulness'],
  ['Preparation education', 'Preparation'],
] as const

export async function SupportDiscovery({ filters }: { filters: FacilitatorFilters }) {
  const { t } = await getTranslation()
  return <nav aria-label={t('Type of support')} className="mb-6 flex flex-wrap gap-2">
    {startingPoints.map(([service, label]) => {
      const params = filterSearchParams(filters)
      // A starting point replaces prior text/service searches while retaining
      // practical preferences such as location, format, pricing and sort.
      params.delete('q')
      params.delete('modality')
      params.append('modality', service)
      const selected = !filters.q && filters.modalities.length === 1 && filters.modalities[0] === service
      return <Link key={service} href={directoryHref(params)} aria-current={selected ? 'true' : undefined}
        className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${selected ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-stone-300 bg-white text-emerald-900 hover:bg-emerald-50'}`}>
        {t(label)}
      </Link>
    })}
  </nav>
}
