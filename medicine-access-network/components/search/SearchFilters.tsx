'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { MODALITIES, MODALITY_CATEGORIES } from '@/lib/constants'

const EXPERIENCE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '2+ yrs', value: '2' },
  { label: '5+ yrs', value: '5' },
  { label: '10+ yrs', value: '10' },
] as const

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locationRef = useRef<HTMLInputElement>(null)

  const selectedModalities = searchParams.getAll('modality')
  const remoteOnly = searchParams.get('remote') === 'true'
  const donationOnly = searchParams.get('donation') === 'true'
  const minExp = searchParams.get('min_exp') ?? ''
  const locationFilter = searchParams.get('location') ?? ''

  const activeCount =
    selectedModalities.length +
    (remoteOnly ? 1 : 0) +
    (donationOnly ? 1 : 0) +
    (minExp ? 1 : 0) +
    (locationFilter ? 1 : 0)

  // Generic toggle helper for checkbox-style filters
  const toggle = (key: string, value: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'modality') {
      const current = params.getAll('modality').filter((v) => v !== value)
      params.delete('modality')
      current.forEach((v) => params.append('modality', v))
      if (checked) params.append('modality', value)
    } else if (checked) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/facilitators?${params.toString()}`)
  }

  const setMinExp = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set('min_exp', value) : params.delete('min_exp')
    router.push(`/facilitators?${params.toString()}`)
  }

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = locationRef.current?.value.trim() ?? ''
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set('location', value) : params.delete('location')
    router.push(`/facilitators?${params.toString()}`)
  }

  const clearAll = () => router.push('/facilitators')

  const categorized = (
    Object.entries(MODALITY_CATEGORIES) as [keyof typeof MODALITY_CATEGORIES, string][]
  ).map(([key, label]) => ({
    key,
    label,
    modalities: MODALITIES.filter((m) => m.category === key),
  }))

  return (
    <aside className="w-full shrink-0 space-y-5 lg:w-56">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Filters</h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-stone-400 hover:text-stone-700"
            onClick={clearAll}
          >
            Clear all ({activeCount})
          </Button>
        )}
      </div>

      {/* Location */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Location
        </Label>
        <form onSubmit={handleLocationSubmit} className="mt-2 flex gap-1.5">
          <Input
            ref={locationRef}
            key={locationFilter}
            defaultValue={locationFilter}
            placeholder="City or country"
            className="h-8 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 px-2"
            aria-label="Apply location filter"
          >
            <Search className="size-3.5" />
          </Button>
        </form>
        {locationFilter && (
          <button
            className="mt-1 text-xs text-stone-400 hover:text-stone-600"
            onClick={() => {
              if (locationRef.current) locationRef.current.value = ''
              toggle('location', '', false)
            }}
          >
            ✕ {locationFilter}
          </button>
        )}
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Availability
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Checkbox
            id="remote"
            checked={remoteOnly}
            onCheckedChange={(checked) => toggle('remote', 'true', !!checked)}
          />
          <label htmlFor="remote" className="cursor-pointer text-sm text-stone-700">
            Remote / online only
          </label>
        </div>
      </div>

      <Separator />

      {/* Pricing */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Pricing
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <Checkbox
            id="donation"
            checked={donationOnly}
            onCheckedChange={(checked) => toggle('donation', 'true', !!checked)}
          />
          <label htmlFor="donation" className="cursor-pointer text-sm text-stone-700">
            Donation-based only
          </label>
        </div>
      </div>

      <Separator />

      {/* Experience */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Experience
        </Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXPERIENCE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMinExp(value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                (value === '' ? minExp === '' : minExp === value)
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Modalities grouped by category */}
      {categorized
        .filter((c) => c.modalities.length > 0)
        .map((category) => (
          <div key={category.key}>
            <Label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {category.label}
            </Label>
            <div className="mt-2 space-y-2">
              {category.modalities.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Checkbox
                    id={m.id}
                    checked={selectedModalities.includes(m.name)}
                    onCheckedChange={(checked) =>
                      toggle('modality', m.name, !!checked)
                    }
                  />
                  <label
                    htmlFor={m.id}
                    className="cursor-pointer text-sm text-stone-700"
                  >
                    {m.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
    </aside>
  )
}
