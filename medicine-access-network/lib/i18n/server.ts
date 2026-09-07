import 'server-only'

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { LANGUAGE_COOKIE, createTranslator, dictionaryFor, languagePreference, resolveLocale } from './config'
import { commonMessages } from './messages/common'
import { resourceMessages } from './messages/resources'
import { platformMessages } from './messages/platform'
import { discoveryMessages } from './messages/discovery'
import { directoryMessages } from './messages/directory'
import { accountsMessages } from './messages/accounts'
import { dashboardMessages } from './messages/dashboards'

export const getTranslation = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const preference = languagePreference(cookieStore.get(LANGUAGE_COOKIE)?.value)
  const locale = resolveLocale(preference, headerStore.get('accept-language'))
  // Catalogs stay on the server. Only this visitor's language is serialized.
  const dictionary = dictionaryFor(locale, [commonMessages, resourceMessages, platformMessages, discoveryMessages, directoryMessages, accountsMessages, dashboardMessages])
  return { locale, preference, dictionary, t: createTranslator(dictionary) }
})
