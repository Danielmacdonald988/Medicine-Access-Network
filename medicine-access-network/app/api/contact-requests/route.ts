import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { sendFacilitatorInquiryEmail } from '@/lib/email'
import { contactRequestSchema } from '@/lib/validations'

// Stateless, account-free contact path — this endpoint is reachable by
// anyone on the internet with no session at all. See db/migrations/0003
// for the RLS/grant design this route relies on: anon can INSERT into
// booking_requests only in the exact shape this route produces, and the
// two RPCs below (rate limit + facilitator lookup) are the only way this
// route touches anything else.
//
// Honeypot: `website` is a field real users never see or fill (hidden in
// the form UI — see components/forms/ContactRequestForm.tsx). If it has a
// value, the submission is treated as spam and given a fake success
// response with no side effects — never a 4xx, so a scripted bot gets no
// signal that it was caught.

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Can be a comma-separated list; the client's own IP is first.
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // `next dev` has no reverse proxy in front of it, so neither header is
  // ever set locally — Vercel (and any real reverse proxy) always sets
  // x-forwarded-for in production. Without this fallback, local testing of
  // this route always hits the fail-closed rate limit (see the DB
  // function's null-IP guard) and 429s every time.
  if (process.env.NODE_ENV !== 'production') return '127.0.0.1'

  return null
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Honeypot check first — cheapest possible check, no DB calls, and lets
  // us skip spending a rate-limit slot on obvious bot traffic.
  const honeypot = typeof (body as Record<string, unknown>).website === 'string'
    ? ((body as Record<string, unknown>).website as string)
    : ''
  if (honeypot.trim().length > 0) {
    return NextResponse.json({ success: true }, { status: 201 })
  }

  const parsed = contactRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    facilitator_profile_id,
    seeker_name,
    seeker_email,
    requested_service,
    message,
    preferred_format,
    preferred_time_window,
  } = parsed.data

  const supabase = await createServerSupabaseClient()

  // ── Rate limit by IP ─────────────────────────────────────────────────────
  const ip = getClientIp(request)
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    'check_and_record_contact_rate_limit',
    { p_ip_address: ip, p_window_seconds: 3600, p_max_attempts: 5 }
  )

  if (rateLimitError) {
    console.error('[contact-requests] rate limit check failed', rateLimitError)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests from this connection. Please try again later.' },
      { status: 429 }
    )
  }

  // ── Resolve the facilitator (only succeeds for approved + public) ──────────
  const { data: contactInfoRows, error: contactInfoError } = await supabase.rpc(
    'get_facilitator_contact_info',
    { p_facilitator_profile_id: facilitator_profile_id }
  )

  if (contactInfoError) {
    console.error('[contact-requests] facilitator lookup failed', contactInfoError)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  const facilitator = contactInfoRows?.[0]
  if (!facilitator) {
    return NextResponse.json({ error: 'Guide not found or not available' }, { status: 404 })
  }

  // ── Store the inquiry ────────────────────────────────────────────────────
  const { error: insertError } = await supabase.from('booking_requests').insert({
    facilitator_id: facilitator.facilitator_user_id,
    seeker_name,
    seeker_email,
    requested_service,
    message,
    preferred_format,
    preferred_time_window: preferred_time_window ?? null,
    status: 'pending',
  })

  if (insertError) {
    console.error('[contact-requests] insert failed', insertError)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  // ── Notify the facilitator (best-effort — the inquiry is already durably
  //    stored regardless of whether this succeeds) ───────────────────────────
  await sendFacilitatorInquiryEmail({
    facilitatorEmail: facilitator.facilitator_email,
    facilitatorDisplayName: facilitator.facilitator_display_name,
    seekerName: seeker_name,
    seekerEmail: seeker_email,
    requestedService: requested_service,
    message,
    preferredFormat: preferred_format,
    preferredTimeWindow: preferred_time_window,
  })

  // Never echo facilitator contact info (or anything from the RPC above)
  // back to the client — this response is intentionally minimal.
  return NextResponse.json({ success: true }, { status: 201 })
}
