import 'server-only'

// Email stub — swap the implementation without changing call sites, same
// pattern as lib/analytics.ts.
//
// Uses Resend's plain HTTP API (https://resend.com/docs/api-reference/emails/send-email)
// via fetch — no SDK dependency needed. Set RESEND_API_KEY and
// RESEND_FROM_EMAIL to activate.
//
// Without them, notification is skipped without logging personal information —
// fine for local development, but be aware: the contact-request flow has no
// other delivery path. If these aren't configured in production, inquiries
// are still stored (see app/api/contact-requests/route.ts — storage and
// email are independent; a facilitator can still see requests in their
// dashboard) but the facilitator will not be notified by email.

interface FacilitatorInquiryEmailInput {
  facilitatorEmail: string
  facilitatorDisplayName: string
  seekerName: string
  seekerEmail: string
  requestedService: string
  message: string
  preferredFormat: string
  preferredTimeWindow?: string | null
}

export async function sendFacilitatorInquiryEmail(
  input: FacilitatorInquiryEmailInput
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  const subject = `New conversation request from ${input.seekerName}`
  const text = [
    `${input.seekerName} sent you a conversation request through The Facilitator Network.`,
    '',
    `Looking for: ${input.requestedService}`,
    `Preferred format: ${input.preferredFormat}`,
    input.preferredTimeWindow ? `Preferred time: ${input.preferredTimeWindow}` : null,
    '',
    'Message:',
    input.message,
    '',
    `Reply directly to this email to reach ${input.seekerName} at ${input.seekerEmail}.`,
    'No payment is required to respond to this request.',
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  if (!apiKey || !fromEmail) {
    console.warn(
      '[email] Notification provider not configured; inquiry remains in the dashboard.'
    )
    return { sent: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: input.facilitatorEmail,
        reply_to: input.seekerEmail,
        subject,
        text,
      }),
    })

    if (!res.ok) {
      console.error('[email] Provider rejected notification', { status: res.status })
      return { sent: false }
    }

    return { sent: true }
  } catch {
    console.error('[email] Notification delivery failed')
    return { sent: false }
  }
}
