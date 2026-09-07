'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'

import Link from 'next/link'
import { useState } from 'react'
import { Bookmark, Check } from 'lucide-react'
import { changeSavedGuide, useSavedGuides } from './useSavedGuides'

export function SaveGuideButton({ profileId, displayName, compact = false }: { profileId: string; displayName?: string; compact?: boolean }) {
  const { t } = useTranslation()
  const { ids } = useSavedGuides()
  const saved = ids.includes(profileId.toLowerCase())
  const [status, setStatus] = useState('')
  const [error, setError] = useState(false)

  return (
    <div className={compact ? 'text-xs' : 'text-sm'}>
      <button type="button" aria-pressed={saved} aria-label={t(saved ? 'Remove {name} from saved guides' : 'Save {name} for comparison', { name: displayName ?? t('this guide') })} onClick={() => {
        const failure = changeSavedGuide(profileId)
        setError(Boolean(failure))
        setStatus(failure ?? (saved ? 'Removed from saved guides.' : 'Saved in this browser tab.'))
      }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white/70 px-3 font-medium text-stone-700 hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
        {saved ? <Check aria-hidden className="size-4" /> : <Bookmark aria-hidden className="size-4" />}
        {t(saved ? 'Saved' : 'Save')}
      </button>
      <p role="status" className={status ? `mt-2 max-w-xs ${error ? 'text-red-700' : 'text-stone-600'}` : 'sr-only'}>{t(status)}{status && <>{' '}<Link href="/saved" className="underline underline-offset-2">{t("View saved guides")}</Link></>}</p>
    </div>
  )
}
