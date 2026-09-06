'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bookmark, Check } from 'lucide-react'
import { changeSavedGuide, useSavedGuides } from './useSavedGuides'

export function SaveGuideButton({ profileId, displayName = 'this guide', compact = false }: { profileId: string; displayName?: string; compact?: boolean }) {
  const { ids } = useSavedGuides()
  const saved = ids.includes(profileId.toLowerCase())
  const [status, setStatus] = useState('')
  const [error, setError] = useState(false)

  return (
    <div className={compact ? 'text-xs' : 'text-sm'}>
      <button type="button" aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${displayName}${saved ? ' from saved guides' : ' for comparison'}`} onClick={() => {
        const failure = changeSavedGuide(profileId)
        setError(Boolean(failure))
        setStatus(failure ?? (saved ? 'Removed from saved guides.' : 'Saved in this browser tab.'))
      }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-3 font-medium text-stone-700 hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
        {saved ? <Check aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
        {saved ? 'Saved' : 'Save'}
      </button>
      <p role="status" className={status ? `mt-2 max-w-xs ${error ? 'text-red-700' : 'text-stone-600'}` : 'sr-only'}>{status}{status && <>{' '}<Link href="/saved" className="underline underline-offset-2">View saved guides</Link></>}</p>
    </div>
  )
}
