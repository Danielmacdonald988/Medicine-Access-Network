// Analytics stub — swap the implementation without changing call sites.
//
// To activate Vercel Analytics:
//   1. npm install @vercel/analytics
//   2. Add <Analytics /> to app/layout.tsx (see comment there)
//   3. No changes needed to this file — event tracking goes through track() below.
//
// To activate PostHog, Plausible, or another provider:
//   Replace the track() body with the appropriate SDK call.

export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'facilitator_profile_view'; facilitator_id: string }
  | { name: 'booking_request_sent'; facilitator_id: string; service_type: string }
  | { name: 'booking_request_accepted'; request_id: string }
  | { name: 'booking_request_declined'; request_id: string }
  | { name: 'review_submitted'; facilitator_id: string; rating: number }
  | { name: 'facilitator_application_submitted' }
  | { name: 'seeker_onboarding_completed' }
  | { name: 'facilitator_approved'; facilitator_id: string }
  | { name: 'facilitator_rejected'; facilitator_id: string }
  | { name: 'resource_page_view'; slug: string }
  | { name: 'search_performed'; query: string; result_count: number }

/**
 * Track an analytics event.
 * Currently a no-op — replace the body to activate a real provider.
 */
export function track(event: AnalyticsEvent): void {
  if (process.env.NODE_ENV === 'development') {
    // Log events locally so developers can see what would be tracked.
    console.log('[analytics]', event.name, event)
  }
  // Production: replace with your analytics provider.
  // Examples:
  //   posthog.capture(event.name, event)
  //   plausible(event.name, { props: event })
  //   window.gtag?.('event', event.name, event)
}

/**
 * Track a server-side event from a Route Handler or Server Action.
 * Use this when you cannot access the browser — e.g. after webhook processing.
 */
export async function trackServer(event: AnalyticsEvent): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics:server]', event.name, event)
  }
  // Production: replace with server-side analytics SDK (e.g. PostHog Node client).
}
