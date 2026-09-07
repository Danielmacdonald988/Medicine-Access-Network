'use client'

import { useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { SearchBar, SearchSort } from '@/components/search/SearchBar'
import { SearchFilters } from '@/components/search/SearchFilters'
import { Button } from '@/components/ui/button'
import { parseFacilitatorFilters } from '@/lib/facilitator-search'
import { cn } from '@/lib/utils'

export function DirectorySearchControls() {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const filters = parseFacilitatorFilters(useSearchParams())
  const activeCount = Number(Boolean(filters.q)) + Number(Boolean(filters.location))
    + filters.modalities.length + Number(filters.remote) + Number(filters.donation)
    + Number(Boolean(filters.minExperience))

  const showGuides = () => {
    setOpen(false)
    if (toggleRef.current?.getClientRects().length) toggleRef.current.focus()
  }

  return (
    <div className="min-w-0 lg:contents">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="directory-search-controls"
        onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:hidden"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Search & filters{activeCount > 0 && ` (${activeCount})`}
        <ChevronDown aria-hidden="true" className={cn('ml-auto size-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
      </button>
      <div id="directory-search-controls" className={cn('mt-4 space-y-4 lg:contents lg:space-y-0', !open && 'hidden')}>
        <div className="lg:col-span-2"><SearchBar onSearch={showGuides} /></div>
        <div className="min-w-0 space-y-4 self-start">
          <SearchSort />
          <SearchFilters />
          <Button type="button" onClick={showGuides} className="min-h-12 w-full bg-emerald-700 hover:bg-emerald-800 lg:hidden">Show guides</Button>
        </div>
      </div>
    </div>
  )
}
