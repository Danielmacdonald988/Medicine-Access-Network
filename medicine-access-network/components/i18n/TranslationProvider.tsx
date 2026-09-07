'use client'

import { createContext, useContext, useMemo } from 'react'
import { createTranslator, type Dictionary, type Locale, type LanguagePreference } from '@/lib/i18n/config'

const TranslationContext = createContext({
  locale: 'en' as Locale,
  preference: 'auto' as LanguagePreference,
  t: createTranslator(),
})

export function TranslationProvider({ locale, preference, dictionary, children }: {
  locale: Locale
  preference: LanguagePreference
  dictionary: Dictionary
  children: React.ReactNode
}) {
  // Use refreshed server props rather than freezing the first selected language.
  const value = useMemo(() => ({ locale, preference, t: createTranslator(dictionary) }), [locale, preference, dictionary])
  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  return useContext(TranslationContext)
}
