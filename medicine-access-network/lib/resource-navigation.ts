/** Optional shortcuts for comparison-oriented articles, not crisis/safety resources. */
const profileShortcuts: Record<string, { label: string; href: string }> = {
  'questions-to-ask': { label: 'Compare facilitator profiles', href: '/facilitators#guide-results' },
  'preparation-basics': { label: 'Browse preparation profiles', href: '/facilitators?modality=Preparation+education#guide-results' },
  'integration-basics': { label: 'Browse integration profiles', href: '/facilitators?modality=Integration+conversations#guide-results' },
  'integration-circles-vs-individual': { label: 'Browse integration profiles', href: '/facilitators?modality=Integration+conversations#guide-results' },
  'integration-support-cost': { label: 'Browse integration profiles', href: '/facilitators?modality=Integration+conversations#guide-results' },
  'choosing-breathwork-facilitator': { label: 'Browse breathwork profiles', href: '/facilitators?modality=Breathwork#guide-results' },
  'integration-support-after-retreat': { label: 'Browse integration profiles', href: '/facilitators?modality=Integration+conversations#guide-results' },
  'choosing-somatic-practitioner': { label: 'Browse somatic profiles', href: '/facilitators?modality=Somatic+practices#guide-results' },
}

export function resourceProfileShortcut(slug: string) {
  return Object.hasOwn(profileShortcuts, slug) ? profileShortcuts[slug] : undefined
}
