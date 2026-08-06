import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, Users } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { FacilitatorCard } from '@/components/cards/FacilitatorCard'
import { SafetyDisclaimer } from '@/components/layout/SafetyDisclaimer'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { FacilitatorSearchResult } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Find a Guide',
  description:
    'Browse vetted preparation coaches, integration guides, breathwork practitioners, and somatic workers.',
  // Search/filter query strings (?modality=, ?location=, etc.) are views of
  // this same page, not distinct pages — canonicalizing to the bare path
  // avoids duplicate-content signals from every filter combination getting
  // indexed separately.
  alternates: { canonical: '/facilitators' },
}

// ─── URL param shape ──────────────────────────────────────────────────────────

interface SearchParamsType {
  q?: string
  modality?: string | string[]
  remote?: string
  donation?: string
  min_exp?: string
  location?: string
}

interface PageProps {
  searchParams: Promise<SearchParamsType>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasActiveFilters(params: SearchParamsType): boolean {
  const modalities = Array.isArray(params.modality)
    ? params.modality
    : params.modality
      ? [params.modality]
      : []
  return !!(
    params.q ||
    params.location ||
    params.remote === 'true' ||
    params.donation === 'true' ||
    params.min_exp ||
    modalities.length > 0
  )
}

// ─── Empty state components ───────────────────────────────────────────────────
// (The old "get personalized help" card linked to /onboarding/seeker, the
// seeker intake form used to tailor matches. Seekers have no accounts and
// no intake flow anymore — removed along with it rather than repointed
// somewhere that no longer fits.)

function EmptyNoResults({ params }: { params: SearchParamsType }) {
  const filtersActive = hasActiveFilters(params)
  const clearHref = params.q
    ? '/facilitators'
    : `/facilitators${params.location ? '' : ''}`

  return (
    <div className="py-8">
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-stone-100">
          <SlidersHorizontal className="size-5 text-stone-400" />
        </div>

        <h3 className="font-semibold text-stone-900">
          {params.q ? `No guides found for "${params.q}"` : 'No guides match these filters'}
        </h3>

        <p className="mt-2 text-sm text-stone-500">
          {filtersActive
            ? 'Try removing a filter or two to see more results.'
            : 'No guides are available right now. Check back soon.'}
        </p>

        {filtersActive && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-4 text-stone-600"
          >
            <Link href={clearHref}>Clear all filters</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function EmptyNoFacilitators() {
  return (
    <div className="py-8">
      <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-stone-100">
          <Users className="size-5 text-stone-400" />
        </div>
        <h3 className="font-semibold text-stone-900">Guides coming soon</h3>
        <p className="mt-2 text-sm text-stone-500">
          We&apos;re actively reviewing facilitator applications. New profiles appear
          as they are verified — check back soon.
        </p>
      </div>
    </div>
  )
}

// ─── Result grid (server component, streams inside Suspense) ──────────────────

async function FacilitatorGrid({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createServerSupabaseClient()

  const modalities = Array.isArray(params.modality)
    ? params.modality
    : params.modality
      ? [params.modality]
      : []

  // facilitator_public_profiles already filters to approved + public, and
  // doesn't carry a verification_status column to filter on even if we
  // wanted to. It also doesn't have a declared FK relationship PostgREST
  // can embed reviews through (it's a view, not the base table), so ratings
  // are fetched as a second query below instead of a `reviews!facilitator_id`
  // embed.
  let query = supabase
    .from('facilitator_public_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (params.remote === 'true') query = query.eq('remote_available', true)
  if (params.donation === 'true') query = query.eq('donation_based', true)
  if (modalities.length > 0) query = query.overlaps('modalities', modalities)
  if (params.location) query = query.ilike('location', `%${params.location}%`)

  if (params.min_exp) {
    const minExp = parseInt(params.min_exp, 10)
    if (!isNaN(minExp) && minExp > 0) query = query.gte('years_experience', minExp)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    return (
      <p className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        Unable to load guides right now. Please try again in a moment.
      </p>
    )
  }

  const userIds = (data ?? []).map((f) => f.user_id)
  const { data: ratingRows } =
    userIds.length > 0
      ? await supabase.from('reviews').select('facilitator_id, rating').in('facilitator_id', userIds)
      : { data: [] }

  const ratingsByUserId = new Map<string, number[]>()
  for (const r of ratingRows ?? []) {
    const list = ratingsByUserId.get(r.facilitator_id) ?? []
    list.push(r.rating)
    ratingsByUserId.set(r.facilitator_id, list)
  }

  const facilitators: FacilitatorSearchResult[] = (data ?? []).map((f) => {
    const ratings = ratingsByUserId.get(f.user_id) ?? []
    const avg_rating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : undefined
    return { ...f, avg_rating, review_count: ratings.length || undefined }
  })

  // In-memory text search for MVP (move to pg_trgm index for scale)
  const q = params.q?.toLowerCase()
  const filtered = q
    ? facilitators.filter(
        (f) =>
          f.display_name.toLowerCase().includes(q) ||
          f.bio.toLowerCase().includes(q) ||
          (f.location ?? '').toLowerCase().includes(q) ||
          f.modalities.some((m) => m.toLowerCase().includes(q))
      )
    : facilitators

  if (filtered.length === 0) {
    return data && data.length === 0 && !hasActiveFilters(params) ? (
      <EmptyNoFacilitators />
    ) : (
      <EmptyNoResults params={params} />
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-stone-500">
        {filtered.length} {filtered.length === 1 ? 'guide' : 'guides'} found
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((f) => (
          <FacilitatorCard key={f.id} facilitator={f} />
        ))}
      </div>
    </>
  )
}

// ─── Page skeleton shown while grid streams ───────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl bg-stone-100"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FacilitatorsPage(props: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Find a guide</h1>
        <p className="mt-2 max-w-xl text-stone-500">
          Every guide on this platform is human-reviewed before appearing here. Browse
          preparation coaches, integration guides, breathwork practitioners, and somatic workers.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      {/* Sidebar + grid */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <Suspense>
          <SearchFilters />
        </Suspense>

        <div className="min-w-0 flex-1">
          <Suspense fallback={<GridSkeleton />}>
            <FacilitatorGrid {...props} />
          </Suspense>
        </div>
      </div>

      {/* Legal */}
      <div className="mt-16">
        <SafetyDisclaimer compact />
      </div>
    </div>
  )
}
