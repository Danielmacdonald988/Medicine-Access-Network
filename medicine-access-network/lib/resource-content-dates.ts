// Significant content dates, verified against published content-changing commits.
// Never derive these from builds, requests, source-check labels, or shared UI edits.
// Omit a date until the page's substantive content change is verified.
const verifiedResourceContentDates: Readonly<Record<string, string>> = {
  // PR49: 62617ebe30a72e5b2c42547186be3ff7d266750a, 2026-11-08 01:36 UTC.
  'integration-circles-vs-individual': '2026-11-08',
  // PR46 added online-readiness content (3a7cab7, 01:30 UTC Nov 8);
  // PR49 added a relevant comparison-guide link (62617eb, 01:36 UTC Nov 8).
  'integration-basics': '2026-11-08',
}

export function getVerifiedResourceContentDate(slug: string): string | undefined {
  return Object.hasOwn(verifiedResourceContentDates, slug)
    ? verifiedResourceContentDates[slug]
    : undefined
}
