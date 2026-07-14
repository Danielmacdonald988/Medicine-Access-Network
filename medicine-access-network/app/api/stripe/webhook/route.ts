import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { constructWebhookEvent } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// Stripe requires the raw request body for signature verification.
// Next.js App Router gives us it via request.text().
export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = await constructWebhookEvent(rawBody, sig)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid webhook'
    console.error('[stripe webhook] signature verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingRequestId = session.metadata?.booking_request_id

      if (bookingRequestId && session.payment_status === 'paid') {
        await supabase
          .from('booking_requests')
          .update({
            payment_status: 'paid',
            stripe_session_id: session.id,
          })
          .eq('id', bookingRequestId)
      }

      // Handle facilitator subscription activation.
      const facilitatorUserId = session.metadata?.facilitator_user_id
      if (facilitatorUserId && session.mode === 'subscription' && session.subscription) {
        await supabase
          .from('facilitator_subscriptions')
          .upsert(
            {
              facilitator_id: facilitatorUserId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              status: 'active',
              plan: session.metadata?.plan ?? 'facilitator-monthly',
            },
            { onConflict: 'facilitator_id' }
          )
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      const bookingRequestId = session.metadata?.booking_request_id
      if (bookingRequestId) {
        await supabase
          .from('booking_requests')
          .update({ payment_status: 'not_required' })
          .eq('id', bookingRequestId)
          .eq('payment_status', 'pending') // only reset if still pending
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string | null
      if (paymentIntentId) {
        await supabase
          .from('booking_requests')
          .update({ payment_status: 'refunded' })
          .eq('stripe_payment_intent_id', paymentIntentId)
      }
      break
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const status =
        event.type === 'customer.subscription.deleted' || sub.status !== 'active'
          ? 'inactive'
          : 'active'

      await supabase
        .from('facilitator_subscriptions')
        .update({ status })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    default:
      // Unhandled event — log and return 200 so Stripe does not retry.
      console.log(`[stripe webhook] unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
