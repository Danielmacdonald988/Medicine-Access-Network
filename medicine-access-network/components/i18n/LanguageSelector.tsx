'use client'

import { useId, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Languages } from 'lucide-react'
import { LANGUAGE_COOKIE, LANGUAGE_NAMES, LOCALES, languagePreference } from '@/lib/i18n/config'
import { useTranslation } from './TranslationProvider'

export function LanguageSelector() {
  const { t, locale, preference } = useTranslation()
  const id = useId()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 text-sm">
      <Languages aria-hidden="true" className="size-4 shrink-0" />
      <label htmlFor={id} className="sr-only">{t('Language')}</label>
      <select
        id={id}
        value={preference}
        disabled={pending}
        aria-busy={pending}
        className="min-h-11 w-full min-w-0 max-w-48 rounded-lg border border-stone-300 bg-background px-2 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
        onChange={(event) => {
          const next = languagePreference(event.target.value)
          // This cookie contains only a language code, never account information.
          const secure = window.location.protocol === 'https:' ? '; Secure' : ''
          document.cookie = `${LANGUAGE_COOKIE}=${next === 'auto' ? '' : next}; Path=/; Max-Age=${next === 'auto' ? 0 : 31536000}; SameSite=Lax${secure}`
          startTransition(() => router.refresh())
        }}
      >
        <option value="auto">{preference === 'auto' ? `${LANGUAGE_NAMES[locale]} · ` : ''}{t('Browser default')}</option>
        {LOCALES.map((language) => <option key={language} value={language} lang={language}>{LANGUAGE_NAMES[language]}</option>)}
      </select>
      <span className="sr-only" role="status">{pending ? t('Changing language…') : ''}</span>
    </div>
  )
}
