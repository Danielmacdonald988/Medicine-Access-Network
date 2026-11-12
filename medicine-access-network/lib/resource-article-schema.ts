import { SITE_URL } from './constants'
import { serializeStructuredData } from './organization-identity'
import { getVerifiedResourceContentDate } from './resource-content-dates'
import type { Resource } from './resources'

// Article markup for a safety-library guide. It describes the English
// editorial text that is actually on the page and names the organization
// (see organization-identity.ts) as publisher. Deliberately omitted:
//  - a personal author: guides are published under the brand, not a person;
//  - datePublished: no verified publication dates are recorded;
//  - dateModified unless resource-content-dates.ts holds a verified date;
//  - any medical/health schema type: these guides are educational only.
export function resourceArticleStructuredData(resource: Pick<Resource, 'slug' | 'title' | 'searchTitle' | 'description'>) {
  const url = `${SITE_URL}/resources/${resource.slug}`
  const dateModified = getVerifiedResourceContentDate(resource.slug)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: resource.searchTitle ?? resource.title,
    description: resource.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    ...(dateModified ? { dateModified } : {}),
  }
}

export function resourceArticleJsonLd(resource: Parameters<typeof resourceArticleStructuredData>[0]): string {
  return serializeStructuredData(resourceArticleStructuredData(resource))
}
