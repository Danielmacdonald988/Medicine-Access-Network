export const LOCALES = ['en', 'es', 'fr', 'pt', 'de', 'it', 'nl', 'zh-CN', 'ja', 'ko'] as const
export type Locale = typeof LOCALES[number]
export type LanguagePreference = Locale | 'auto'
export const LANGUAGE_COOKIE = 'tfn_language'
export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English', es: 'Español', fr: 'Français', pt: 'Português', de: 'Deutsch',
  it: 'Italiano', nl: 'Nederlands', 'zh-CN': '简体中文', ja: '日本語', ko: '한국어',
}

/** Translation order: Spanish, French, Portuguese, German, Italian, Dutch,
 * Simplified Chinese, Japanese, Korean. English is the message key. */
export type MessageCatalog = Record<string, readonly [string, string, string, string, string, string, string, string, string]>
export type Dictionary = Record<string, string>
export type TranslationParams = Record<string, string | number>
export type Translator = (message: string, params?: TranslationParams) => string

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function languagePreference(value: unknown): LanguagePreference {
  return isLocale(value) ? value : 'auto'
}

function matchLanguage(tag: string): Locale | undefined {
  if (tag === '*') return 'en'
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(tag)) return undefined
  const base = tag.split('-')[0].toLowerCase()
  if (base === 'zh') return 'zh-CN'
  return isLocale(base) ? base : undefined
}

/** Resolve on the server to avoid an English flash or hydration mismatch.
 * A saved selection takes priority over quality-ranked browser preferences. */
export function resolveLocale(preference: unknown, acceptLanguage: string | null): Locale {
  if (isLocale(preference)) return preference
  const candidates = (acceptLanguage ?? '').slice(0, 4096).split(',').map((entry, index) => {
    const [tag, ...parameters] = entry.trim().split(';')
    const quality = parameters.find((parameter) => /^\s*q\s*=/i.test(parameter))
    const rawQuality = quality?.split('=')[1]?.trim()
    const validQuality = rawQuality === undefined || /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(rawQuality)
    return { locale: matchLanguage(tag), q: validQuality ? Number(rawQuality ?? 1) : 0, index }
  })
  candidates.sort((a, b) => b.q - a.q || a.index - b.index)
  return candidates.find((candidate) => candidate.locale && candidate.q > 0)?.locale ?? 'en'
}

export function createTranslator(dictionary: Dictionary = {}): Translator {
  return (message, params) => {
    const translated = Object.prototype.hasOwnProperty.call(dictionary, message) ? dictionary[message] : message
    return (translated || message).replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (token, key: string) =>
      params && Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : token,
    )
  }
}

export function dictionaryFor(locale: Locale, catalogs: MessageCatalog[]): Dictionary {
  if (locale === 'en') return {}
  const index = LOCALES.indexOf(locale) - 1
  return Object.fromEntries(catalogs.flatMap((catalog) =>
    Object.entries(catalog).map(([message, translations]) => [message, translations[index]]),
  ))
}
