'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { directoryHref, filterSearchParams, parseFacilitatorFilters } from '@/lib/facilitator-search'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const filters = parseFacilitatorFilters(searchParams)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    const params = filterSearchParams(filters)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    startTransition(() => router.push(directoryHref(params), { scroll: false }))
  }

  return (
    <form role="search" aria-label="Guide directory" onSubmit={handleSubmit} className="flex gap-2" aria-busy={isPending}>
      <div className="relative flex-1">
        <label htmlFor="guide-search" className="sr-only">Search guides by name, modality, or location</label>
        <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          id="guide-search"
          name="q"
          type="search"
          key={filters.q}
          ref={inputRef}
          defaultValue={filters.q}
          maxLength={120}
          placeholder="Name, modality, or location…"
          className="h-11 bg-white pl-9"
        />
      </div>
      <Button type="submit" disabled={isPending} className="h-11 bg-emerald-700 hover:bg-emerald-800">
        {isPending ? 'Searching…' : 'Search'}
      </Button>
    </form>
  )
}
