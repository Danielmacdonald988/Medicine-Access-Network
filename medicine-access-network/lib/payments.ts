// ─── Feature flag ────────────────────────────────────────────────────────────
// Payments are inactive by default. Set NEXT_PUBLIC_PAYMENTS_ENABLED=true in
// .env.local only after Stripe is fully configured and legal review is complete.

export const PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'

// ─── Payment status ───────────────────────────────────────────────────────────

export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'refunded' | 'failed'

// ─── Allowed service types ────────────────────────────────────────────────────
// These are the ONLY service types that may be charged through this platform.
// Labels are deliberately plain and legal — never reference substances, medicine,
// ceremonies, or anything involving controlled substances.

export interface ServiceType {
  /** Human-readable label shown on invoices, receipts, and Stripe. */
  label: string
  /** Sentence shown to users before checkout. */
  description: string
  /** Default price in USD cents when no Stripe price ID is configured. */
  defaultAmountCents: number
  /** Set via env var once Stripe products are created. Null = not yet configured. */
  stripePriceIdEnvKey: string
}

export const ALLOWED_SERVICE_TYPES = {
  'preparation-session': {
    label: 'Preparation Coaching Session',
    description:
      'A one-on-one preparation coaching session focused on intention-setting, ' +
      'safety planning, and orientation before a personal wellness experience.',
    defaultAmountCents: 12000, // $120
    stripePriceIdEnvKey: 'STRIPE_PRICE_PREPARATION_SESSION',
  },
  'integration-session': {
    label: 'Integration Coaching Session',
    description:
      'A one-on-one integration coaching session to help process insights, ' +
      'ground experience, and support ongoing personal growth after a wellness experience.',
    defaultAmountCents: 12000, // $120
    stripePriceIdEnvKey: 'STRIPE_PRICE_INTEGRATION_SESSION',
  },
  'breathwork-session': {
    label: 'Breathwork Session',
    description:
      'A facilitated breathwork session using conscious breathing techniques ' +
      'for self-exploration, stress reduction, and emotional processing.',
    defaultAmountCents: 9000, // $90
    stripePriceIdEnvKey: 'STRIPE_PRICE_BREATHWORK_SESSION',
  },
  'education-session': {
    label: 'Educational Consultation',
    description:
      'An educational consultation covering harm reduction, safety practices, ' +
      'and informed decision-making in the context of personal wellness.',
    defaultAmountCents: 7500, // $75
    stripePriceIdEnvKey: 'STRIPE_PRICE_EDUCATION_SESSION',
  },
  'facilitator-donation': {
    label: 'Donation to Facilitator',
    description:
      'A voluntary donation to support a facilitator offering sliding-scale ' +
      'or donation-based coaching services.',
    defaultAmountCents: 5000, // $50 default — overridden per-request
    stripePriceIdEnvKey: '', // Donations use dynamic pricing, not a fixed price ID
  },
} as const satisfies Record<string, ServiceType>

export type AllowedServiceTypeKey = keyof typeof ALLOWED_SERVICE_TYPES

// ─── Facilitator subscription plans ──────────────────────────────────────────

export interface SubscriptionPlan {
  key: string
  label: string
  description: string
  amountCents: number
  interval: 'month' | 'year'
  stripePriceIdEnvKey: string
}

export const FACILITATOR_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: 'facilitator-monthly',
    label: 'Guide Membership — Monthly',
    description:
      'Monthly platform membership for verified guides. ' +
      'Includes public profile listing, booking request access, and review collection.',
    amountCents: 2900, // $29/month
    interval: 'month',
    stripePriceIdEnvKey: 'STRIPE_PRICE_FACILITATOR_SUBSCRIPTION',
  },
]

// ─── Guards ───────────────────────────────────────────────────────────────────

// These words must never appear in any payment description, product name,
// or line-item label sent to Stripe.
const FORBIDDEN_PAYMENT_TERMS = [
  'medicine',
  'substance',
  'ceremony',
  'illegal',
  'psilocybin',
  'mdma',
  'lsd',
  'ketamine',
  'dmt',
  'ayahuasca',
  'ibogaine',
  'mushroom',
  'drug',
  'psychedelic',
  'controlled',
]

export function assertLegalPaymentLabel(text: string): void {
  const lower = text.toLowerCase()
  const hit = FORBIDDEN_PAYMENT_TERMS.find((term) => lower.includes(term))
  if (hit) {
    throw new Error(
      `Payment label contains forbidden term "${hit}". ` +
        'All payment descriptions must reference only legal coaching or educational services.'
    )
  }
}

export function isAllowedServiceType(key: string): key is AllowedServiceTypeKey {
  return Object.prototype.hasOwnProperty.call(ALLOWED_SERVICE_TYPES, key)
}

// ─── Price resolution ─────────────────────────────────────────────────────────

/**
 * Returns the Stripe Price ID for a service type from env, or null if not set.
 * Never falls back to a default when env key is empty — caller must handle null.
 */
export function getStripePriceId(envKey: string): string | null {
  if (!envKey) return null
  const value = process.env[envKey]
  return value && value.startsWith('price_') ? value : null
}
