import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  PAYMENTS_ENABLED,
  isAllowedServiceType,
  getStripePriceId,
  ALLOWED_SERVICE_TYPES,
} from '@/lib/payments'
import { createCheckoutSession } from '@/lib/stripe'

const checkoutSchema = z.object({
  booking_request_id: z.string().uuid(),
  service_type: z.string(),
  /** Optional override amount in cents (for donations). */
  amount_cents: z.number().int().min(50).optional(),
})

export async function POST(request: Request) {
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json(
      { error: 'Payments are not yet enabled on this platform.' },
      { status: 503 }
    )
  }

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'seeker') {
    return NextResponse.json({ error: 'Only seekers can initiate payments' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { booking_request_id, service_type, amount_cents } = parsed.data

  if (!isAllowedServiceType(service_type)) {
    return NextResponse.json(
      { error: 'Service type is not eligible for payment on this platform.' },
      { status: 400 }
    )
  }

  // Booking request must exist, belong to this seeker, and be accepted.
  const { data: bookingRequest } = await supabase
    .from('booking_requests')
    .select('id, seeker_id, facilitator_id, status, payment_status, requested_service')
    .eq('id', booking_request_id)
    .eq('seeker_id', user.id)
    .single()

  if (!bookingRequest) {
    return NextResponse.json({ error: 'Booking request not found' }, { status: 404 })
  }

  if (bookingRequest.status !== 'accepted') {
    return NextResponse.json(
      { error: 'Payment is only available for accepted booking requests.' },
      { status: 409 }
    )
  }

  if (bookingRequest.payment_status === 'paid') {
    return NextResponse.json(
      { error: 'This booking request has already been paid.' },
      { status: 409 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const serviceConfig = ALLOWED_SERVICE_TYPES[service_type]
  const stripePriceId = getStripePriceId(serviceConfig.stripePriceIdEnvKey)

  let checkoutUrl: string
  try {
    checkoutUrl = await createCheckoutSession({
      serviceTypeKey: service_type,
      amountCents: amount_cents,
      stripePriceId,
      bookingRequestId: booking_request_id,
      seekerId: user.id,
      facilitatorId: bookingRequest.facilitator_id,
      successUrl: `${appUrl}/seeker?payment=success`,
      cancelUrl: `${appUrl}/seeker?payment=cancelled`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Mark as pending in DB so we can reconcile with the webhook.
  await supabase
    .from('booking_requests')
    .update({ payment_status: 'pending' })
    .eq('id', booking_request_id)

  return NextResponse.json({ url: checkoutUrl }, { status: 200 })
}
