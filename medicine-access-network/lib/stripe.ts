// Server-only. Never import this file in Client Components.
import 'server-only'
import Stripe from 'stripe'
import { assertLegalPaymentLabel, ALLOWED_SERVICE_TYPES, type AllowedServiceTypeKey } from './payments'

// ─── Singleton ────────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set. Configure Stripe before enabling payments.')
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
    })
  }
  return _stripe
}

// ─── Checkout session ─────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  serviceTypeKey: AllowedServiceTypeKey
  /** Amount in cents. Required for donation types; ignored for fixed-price types with a price ID. */
  amountCents?: number
  /** Stripe Price ID. If provided, used directly. If null, falls back to amountCents + service label. */
  stripePriceId: string | null
  bookingRequestId: string
  seekerId: string
  facilitatorId: string
  /** Absolute URL to redirect on success — include a session_id placeholder if needed. */
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
  const stripe = getStripe()
  const service = ALLOWED_SERVICE_TYPES[params.serviceTypeKey]

  // Guard: verify the label is legal before sending to Stripe.
  assertLegalPaymentLabel(service.label)
  assertLegalPaymentLabel(service.description)

  // Inline type — avoids navigating Stripe v22's nested namespace exports.
  type LineItem = { price: string; quantity: number } | {
    quantity: number
    price_data: { currency: string; unit_amount: number; product_data: { name: string; description: string } }
  }
  let lineItems: LineItem[]

  if (params.stripePriceId) {
    // Use a pre-configured Stripe Price (recommended for production).
    lineItems = [{ price: params.stripePriceId, quantity: 1 }]
  } else {
    // Dynamic pricing — used for donations or when price IDs are not yet set.
    const amount = params.amountCents ?? service.defaultAmountCents
    if (!amount || amount < 50) {
      throw new Error('Amount must be at least 50 cents.')
    }
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {
            name: service.label,
            description: service.description,
          },
        },
      },
    ]
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      booking_request_id: params.bookingRequestId,
      service_type: params.serviceTypeKey,
      seeker_id: params.seekerId,
      facilitator_id: params.facilitatorId,
    },
    // Collect a receipt email automatically.
    invoice_creation: { enabled: true },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return session.url
}

// ─── Subscription session ─────────────────────────────────────────────────────

export interface CreateSubscriptionCheckoutParams {
  stripePriceId: string
  facilitatorUserId: string
  stripeCustomerId?: string
  successUrl: string
  cancelUrl: string
}

export async function createSubscriptionCheckoutSession(
  params: CreateSubscriptionCheckoutParams
): Promise<string> {
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: params.stripePriceId, quantity: 1 }],
    ...(params.stripeCustomerId ? { customer: params.stripeCustomerId } : {}),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      facilitator_user_id: params.facilitatorUserId,
      plan: 'facilitator-monthly',
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return session.url
}

// ─── Billing portal ───────────────────────────────────────────────────────────

export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

// ─── Webhook validation ───────────────────────────────────────────────────────

export async function constructWebhookEvent(
  rawBody: string,
  signature: string
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set.')
  }
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(rawBody, signature, secret)
}
