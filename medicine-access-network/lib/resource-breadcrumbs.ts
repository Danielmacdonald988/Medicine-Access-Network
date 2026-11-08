import { APP_NAME, SITE_URL } from './constants'

export function resourceBreadcrumbs(slug: string, title: string, libraryLabel: string) {
  return [
    { name: APP_NAME, href: '/' },
    { name: libraryLabel, href: '/resources' },
    { name: title, href: `/resources/${slug}` },
  ]
}

export function breadcrumbJsonLd(crumbs: ReturnType<typeof resourceBreadcrumbs>) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.href === '/' ? '' : crumb.href}`,
    })),
  }).replace(/</g, '\\u003c')
}
