import { APP_NAME, SITE_URL } from './constants'

// Scope verified against the public homepage and About page. These are brand
// accounts verified by the owner, never personal or founder identities.
export const ORGANIZATION_DESCRIPTION = 'The Facilitator Network is a directory and educational resource for adults exploring preparation, integration, breathwork, somatic practices, meditation and spiritual support. It helps people compare self-reported facilitator profiles and start conversations; it does not provide treatment or arrange access to controlled substances.'
export const OFFICIAL_BRAND_PROFILES = [
  { name: 'Instagram', url: 'https://www.instagram.com/thefacilitatornetwork/' },
  { name: 'YouTube', url: 'https://www.youtube.com/@thefacilitatornetwork' },
] as const

export function organizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: APP_NAME,
        url: SITE_URL,
        description: ORGANIZATION_DESCRIPTION,
        sameAs: OFFICIAL_BRAND_PROFILES.map(profile => profile.url),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: APP_NAME,
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
    ],
  }
}

export function serializeStructuredData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
