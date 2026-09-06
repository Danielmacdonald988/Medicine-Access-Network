'use client'

import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSavedGuides } from './useSavedGuides'

export function SavedGuidesLink({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { ids } = useSavedGuides()
  return <Link href="/saved" aria-label={`Saved guides${ids.length ? `, ${ids.length} saved` : ''}`} className={cn('inline-flex min-h-11 items-center gap-1.5 rounded text-sm font-medium text-stone-600 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700', className)}>
    <Bookmark aria-hidden className="size-4" />
    {compact ? 'Saved' : 'Saved guides'}{ids.length > 0 && <span className="rounded-full bg-emerald-50 px-1.5 text-xs text-emerald-800">{ids.length}</span>}
  </Link>
}
