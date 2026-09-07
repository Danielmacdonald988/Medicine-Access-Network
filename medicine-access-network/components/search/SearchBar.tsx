'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search } from 'lucide-react'
import { directoryHref, filterSearchParams, parseFacilitatorFilters } from '@/lib/facilitator-search'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const filters = parseFacilitatorFilters(searchParams)
  const preserved = filterSearchParams(filters)
  preserved.delete('q')
  preserved.delete('location')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const params = new URLSearchParams(preserved)
    params.set('q', String(form.get('q') ?? ''))
    params.set('location', String(form.get('location') ?? ''))
    const normalized = filterSearchParams(parseFacilitatorFilters(params))
    startTransition(() => router.push(directoryHref(normalized), { scroll: false }))
  }

  return (
    <form action="/facilitators" method="get" role="search" aria-label="Guide directory" onSubmit={handleSubmit} className="rounded-xl border border-stone-300 bg-white p-4 shadow-[0_10px_30px_#1e37260c] sm:p-6" aria-busy={isPending}>
      {Array.from(preserved).map(([name, value]) => <input key={`${name}-${value}`} type="hidden" name={name} value={value} />)}
      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor="guide-search" className="mb-2 block text-xs font-medium text-stone-600">Support or guide</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input id="guide-search" name="q" type="search" key={filters.q} defaultValue={filters.q} maxLength={120} placeholder="Preparation, integration, or a name" className="h-12 border-stone-200 bg-stone-50/60 pl-9 text-base shadow-none" />
          </div>
        </div>
        <div>
          <label htmlFor="guide-location" className="mb-2 block text-xs font-medium text-stone-600">Location <span className="font-normal text-stone-500">(optional)</span></label>
          <div className="relative">
            <MapPin aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input id="guide-location" name="location" key={filters.location} defaultValue={filters.location} maxLength={100} placeholder="City, state, or country" className="h-12 border-stone-200 bg-stone-50/60 pl-9 text-base shadow-none" />
          </div>
        </div>
        <Button type="submit" disabled={isPending} className="h-12 bg-emerald-700 px-7 hover:bg-emerald-800">
          {isPending ? 'Searching…' : 'Find a guide'}
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-stone-600">Search the location listed on a profile. For online support, leave location blank and use the online filter; confirm the guide can work with you where you live.</p>
    </form>
  )
}

export function SearchSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = parseFacilitatorFilters(searchParams)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex shrink-0 items-center gap-2" aria-busy={isPending}>
      <label htmlFor="guide-sort" className="text-sm text-stone-600">Sort by</label>
      <select id="guide-sort" value={filters.sort} disabled={isPending} onChange={(event) => {
        const params = filterSearchParams(filters)
        params.set('sort', event.target.value)
        startTransition(() => router.push(directoryHref(filterSearchParams(parseFacilitatorFilters(params))), { scroll: false }))
      }} className="min-h-11 min-w-0 rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
        <option value="newest">Newest profiles</option>
        <option value="name">Name A–Z</option>
      </select>
      <span role="status" className="sr-only">{isPending ? 'Sorting guide results…' : ''}</span>
    </div>
  )
}
