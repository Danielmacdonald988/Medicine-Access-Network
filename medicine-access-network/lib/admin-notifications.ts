import 'server-only'
import { SITE_URL } from '@/lib/constants'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'

const SEND_TIMEOUT_MS = 5_000
const DATABASE_TIMEOUT_MS = 3_000
const MAX_DISPATCH_COUNT = 5
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/

interface AdminEmailConfiguration {
  apiKey: string
  from: string
  to: string
  origin: string
}

interface ApplicationNotification {
  eventId: string
  profileId: string
}

export interface AdminNotificationDispatchResult {
  sent: number
  failed: number
  configured: boolean
}

function canonicalUuid(value: unknown): string | null {
  return typeof value === 'string' && value.length === 36 && UUID.test(value)
    ? value.toLowerCase()
    : null
}

function configuration(): AdminEmailConfiguration | null {
  // Preview deployments can share production data. Never claim or send alerts
  // from them, even if the mail credentials were copied into that environment.
  if (process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== 'production') return null
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
  if (!apiKey || apiKey.length > 512 || /\s/.test(apiKey) || !from || !to) return null
  if (to.length > 254 || !EMAIL.test(to)) return null
  // Resend accepts either a plain address or a display name followed by <address>.
  const fromAddress = from.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] ?? from
  if (from.length > 320 || !EMAIL.test(fromAddress) || /[\r\n]/.test(from)) return null

  try {
    const site = new URL(SITE_URL)
    if (site.protocol !== 'https:' || site.username || site.password ||
      (SITE_URL !== site.origin && SITE_URL !== `${site.origin}/`)) return null
    return { apiKey, from, to, origin: site.origin }
  } catch {
    return null
  }
}

export function isAdminNotificationConfigured(): boolean {
  return configuration() !== null
}

/** Recipient and review destination come only from server configuration. */
export async function sendAdminApplicationNotification(
  input: ApplicationNotification
): Promise<{ sent: boolean }> {
  const config = configuration()
  const eventId = canonicalUuid(input.eventId)
  const profileId = canonicalUuid(input.profileId)
  if (!config || !eventId || !profileId) return { sent: false }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        // The event survives retries; a lease token changes on every claim.
        // Resend deduplicates this key for 24 hours. The durable outbox retains
        // completed events so later dispatches do not send them again.
        'Idempotency-Key': `facilitator-application/${eventId}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: config.to,
        subject: 'Facilitator application awaiting review — The Facilitator Network',
        text: [
          'A facilitator application is ready for your review.',
          '',
          `Sign in to review it: ${config.origin}/admin#application-${profileId}`,
          '',
          'Application details are available only in your admin dashboard.',
        ].join('\n'),
      }),
    })
    // Acceptance by the provider is not confirmation of inbox delivery. Do not
    // read or log provider response bodies, application details, or credentials.
    return { sent: response.ok }
  } catch {
    return { sent: false }
  }
}

/**
 * Call only after authorization, from a server mutation or an authenticated
 * admin retry. Failure leaves the saved application intact and the outbox
 * retryable. Database leases prevent overlapping dispatchers claiming a row.
 */
export async function dispatchAdminApplicationNotifications(
  { profileId }: { profileId?: string } = {}
): Promise<AdminNotificationDispatchResult> {
  const result = { sent: 0, failed: 0, configured: isAdminNotificationConfigured() }
  if (!result.configured) return result
  const requestedProfile = profileId === undefined ? null : canonicalUuid(profileId)
  if (profileId !== undefined && !requestedProfile) return { ...result, failed: 1 }

  try {
    const client = createAdminSupabaseClient()
    const claim = await client.rpc('claim_admin_application_notifications', {
      p_limit: MAX_DISPATCH_COUNT,
      p_profile_id: requestedProfile,
    }).abortSignal(AbortSignal.timeout(DATABASE_TIMEOUT_MS))
    if (claim.error || !Array.isArray(claim.data)) return { ...result, failed: 1 }

    for (const row of claim.data.slice(0, MAX_DISPATCH_COUNT)) {
      const eventId = canonicalUuid(row?.id)
      const claimedProfile = canonicalUuid(row?.profile_id)
      const claimToken = canonicalUuid(row?.claim_token)
      if (!eventId || !claimedProfile || !claimToken ||
        (requestedProfile !== null && claimedProfile !== requestedProfile)) {
        result.failed += 1
        continue
      }

      const { sent } = await sendAdminApplicationNotification({ eventId, profileId: claimedProfile })
      try {
        const finished = await client.rpc('finish_admin_application_notification', {
          p_id: eventId,
          p_claim_token: claimToken,
          p_sent: sent,
        }).abortSignal(AbortSignal.timeout(DATABASE_TIMEOUT_MS))
        // A failed acknowledgement needs attention even if the provider accepted
        // the email. Its retry will retain the same provider idempotency key.
        if (sent && !finished.error && finished.data === true) result.sent += 1
        else result.failed += 1
      } catch {
        result.failed += 1
      }
    }
    return result
  } catch {
    return { ...result, failed: result.failed + 1 }
  }
}
