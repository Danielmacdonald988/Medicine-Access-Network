import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, Users, X } from 'lucide-react'
import { SearchBar, SearchSort } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchRecovery } from '@/components/search/SearchRecovery'
import { FacilitatorCard } from '@/components/cards/FacilitatorCard'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import {
  addFacilitatorRatings,
  boundedInteger,
  buildFacilitatorQuery,
  DIRECTORY_PAGE_SIZE,
  directoryHref,
  filterSearchParams,
  hasActiveFilters,
  parseFacilitatorFilters,
  toSearchParams,
  type DirectorySearchParams,
  type FacilitatorFilters,
} from '@/lib/facilitator-search'
import type { FacilitatorSearchResult } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Find Psychedelic Preparation & Integration Support',
  description: 'Compare facilitators offering psychedelic preparation, integration, and related support by location, approach, online availability, and pricing.',
}

interface PageProps {
  searchParams: Promise<DirectorySearchParams>
}

function SupportResources() {
  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-6">
      <p className="font-medium text-stone-900">Still finding your starting point?</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">Explore the different kinds of support and questions to ask before choosing a guide.</p>
      <Link href="/resources" className="mt-4 inline-flex min-h-9 items-center gap-2 text-sm font-medium text-emerald-800 underline underline-offset-4">
        Explore the resource library <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  )
}

function EmptyResults({ filters, page }: { filters: FacilitatorFilters; page: number }) {
  const active = hasActiveFilters(filters)
  const firstPageHref = directoryHref(filterSearchParams(filters))
  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-stone-100">
          {active ? <SlidersHorizontal aria-hidden="true" className="size-5 text-stone-500" /> : <Users aria-hidden="true" className="size-5 text-stone-500" />}
        </div>
        <h2 className="text-lg font-semibold text-stone-900">
          {page > 1 ? 'You’ve reached the end of these results' : active ? 'No guides match your search yet' : 'Guides coming soon'}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-600">
          {page > 1 ? 'Profiles can change. Return to the first page to see the current results.' : active ? 'Try removing a filter, choosing a broader location, or exploring online sessions.' : 'There are no approved profiles to browse right now. New guides appear after their applications are reviewed.'}
        </p>
        {(active || page > 1) && (
          <Button asChild variant="outline" className="mt-5">
            <Link href={page > 1 ? firstPageHref : '/facilitators'}>{page > 1 ? 'Back to first page' : 'Clear search and filters'}</Link>
          </Button>
        )}
      </div>
      <SupportResources />
    </>
  )
}

function ActiveFilters({ filters }: { filters: FacilitatorFilters }) {
  const entries: { key: string; value: string; label: string }[] = [
    ...(filters.q ? [{ key: 'q', value: filters.q, label: `Search: ${filters.q}` }] : []),
    ...(filters.location ? [{ key: 'location', value: filters.location, label: filters.location }] : []),
    ...(filters.remote ? [{ key: 'remote', value: 'true', label: 'Online available' }] : []),
    ...(filters.donation ? [{ key: 'donation', value: 'true', label: 'Donation-based' }] : []),
    ...(filters.minExperience ? [{ key: 'min_exp', value: String(filters.minExperience), label: `${filters.minExperience}+ years of self-reported practice` }] : []),
    ...filters.modalities.map((value) => ({ key: 'modality', value, label: value })),
  ]
  if (!entries.length) return null

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active search and filters">
      {entries.map(({ key, value, label }) => {
        const params = filterSearchParams(filters)
        params.delete(key, value)
        return (
          <Link key={`${key}-${value}`} href={directoryHref(params)} scroll={false} aria-label={`Remove ${label}`} className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100">
            <span className="break-words">{label}</span><X aria-hidden="true" className="size-3 shrink-0" />
          </Link>
        )
      })}
      <Link href="/facilitators" scroll={false} className="px-2 py-2 text-xs font-medium text-stone-600 underline underline-offset-4">Clear all</Link>
    </div>
  )
}

async function FacilitatorGrid({ filters, page }: { filters: FacilitatorFilters; page: number }) {
  const offset = (page - 1) * DIRECTORY_PAGE_SIZE
  let facilitators: FacilitatorSearchResult[] = []
  let total = 0

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error, count } = await buildFacilitatorQuery(supabase, filters, { limit: DIRECTORY_PAGE_SIZE, offset })
    if (error && error.code !== 'PGRST103') throw error
    facilitators = (data ?? []) as unknown as FacilitatorSearchResult[]
    total = count ?? facilitators.length
    facilitators = await addFacilitatorRatings(supabase, facilitators)
  } catch {
    return (
      <>
        <div role="alert" className="rounded-2xl border border-stone-200 bg-white p-8">
          <Search aria-hidden="true" className="mb-4 size-6 text-stone-500" />
          <h2 className="text-lg font-semibold text-stone-900">The directory is temporarily unavailable</h2>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-stone-600">We couldn’t load guide profiles. Your search is saved in the address bar; try again or browse the resource library while you wait.</p>
          <SearchRecovery />
        </div>
        <SupportResources />
      </>
    )
  }

  if (!facilitators.length) return <EmptyResults filters={filters} page={page} />

  const pageCount = Math.ceil(total / DIRECTORY_PAGE_SIZE)
  const pageHref = (number: number) => {
    const params = filterSearchParams(filters)
    if (number > 1) params.set('page', String(number))
    return directoryHref(params)
  }

  return (
    <>
      <p role="status" className="mb-4 text-sm text-stone-600">
        {total} {total === 1 ? 'guide' : 'guides'} found
        {pageCount > 1 && ` · Showing ${offset + 1}–${offset + facilitators.length}`}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {facilitators.map((facilitator) => <FacilitatorCard key={facilitator.id} facilitator={facilitator} />)}
      </div>
      {pageCount > 1 && (
        <nav aria-label="Guide results pages" className="mt-8 flex items-center justify-between gap-3">
          {page > 1 ? <Button asChild variant="outline"><Link href={pageHref(page - 1)}><ArrowLeft aria-hidden="true" className="size-4" /> Previous</Link></Button> : <span />}
          <p className="text-sm text-stone-600">Page {page} of {pageCount}</p>
          {page < pageCount ? <Button asChild variant="outline"><Link href={pageHref(page + 1)}>Next <ArrowRight aria-hidden="true" className="size-4" /></Link></Button> : <span />}
        </nav>
      )}
    </>
  )
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading guides">
      <span className="sr-only">Loading guides…</span>
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-xl bg-stone-100 motion-reduce:animate-none" />)}
      </div>
    </div>
  )
}

export default async function FacilitatorsPage({ searchParams }: PageProps) {
  const params = toSearchParams(await searchParams)
  const filters = parseFacilitatorFilters(params)
  const page = boundedInteger(params.get('page'), 1, 1, 10000)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-800">Find your support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Find a guide for your next step.</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone-600">Compare preparation, integration, breathwork, and somatic support. Read profiles and ask questions directly. No explorer account is needed.</p>
        <Link href="/about#profile-review" className="mt-3 inline-block text-sm text-emerald-800 underline underline-offset-4">What does profile review mean?</Link>
      </div>
      <div className="mb-6"><Suspense><SearchBar /></Suspense></div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Suspense><SearchFilters /></Suspense>
        <section aria-label="Guide search results" className="min-w-0 flex-1">
          <ActiveFilters filters={filters} />
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <details className="max-w-md text-sm text-stone-600">
              <summary className="cursor-pointer py-3 font-medium text-emerald-800 underline underline-offset-4">How profiles are ordered</summary>
              <p className="leading-relaxed">Profiles are ordered by when they were created, newest first, or alphabetically when you choose Name A–Z. Placement is not a quality rating or a recommendation. Guides do not pay for placement.</p>
            </details>
            <Suspense><SearchSort /></Suspense>
          </div>
          <Suspense key={`${filterSearchParams(filters)}:${page}`} fallback={<GridSkeleton />}>
            <FacilitatorGrid filters={filters} page={page} />
          </Suspense>
        </section>
      </div>
      <div className="mt-16"><SafetyDisclaimer compact /></div>
    </div>
  )
}
