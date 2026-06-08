# Environment Variables

Copy `.env.local.example` to `.env.local` and fill in each value.

---

## Required — app will not start without these

### Supabase

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key — safe to expose in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **never expose this to the browser** |

Found at: Supabase Dashboard → Settings → API

---

## Optional — app works without these but some features degrade

### App URL

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Full URL of the app — required in production for correct redirect URLs |

Set this to your Vercel domain (e.g. `https://medicine-access-network.vercel.app`) or custom domain.

---

## Stripe — inactive until `NEXT_PUBLIC_PAYMENTS_ENABLED=true`

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side secret key from Stripe dashboard (`sk_test_...` or `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-safe publishable key (`pk_test_...` or `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for webhook verification (`whsec_...`) |
| `STRIPE_PRICE_PREPARATION_SESSION` | Stripe Price ID for preparation coaching sessions |
| `STRIPE_PRICE_INTEGRATION_SESSION` | Stripe Price ID for integration coaching sessions |
| `STRIPE_PRICE_BREATHWORK_SESSION` | Stripe Price ID for breathwork sessions |
| `STRIPE_PRICE_EDUCATION_SESSION` | Stripe Price ID for educational consultations |
| `STRIPE_PRICE_FACILITATOR_SUBSCRIPTION` | Stripe Price ID for guide platform membership |

**Important:** All Stripe product names and descriptions must reference only legal coaching or educational services. Never label a product with the name of a substance, medicine, or ceremony.

---

## Feature flags

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | Set to `true` to activate Stripe checkout. Requires Stripe keys above. |

### Checklist before enabling payments

- [ ] Stripe account is fully verified and activated
- [ ] All products are created with legal service descriptions
- [ ] All `STRIPE_PRICE_*` env vars are populated
- [ ] `STRIPE_WEBHOOK_SECRET` is registered in Stripe Dashboard → Webhooks
- [ ] Webhook endpoint `https://yourdomain.com/api/stripe/webhook` is registered
- [ ] Legal review of payment flows is complete
- [ ] Test mode confirmed working before switching to live keys

---

## Development vs production

Use **test keys** (`sk_test_...`, `pk_test_...`) in development. Never commit live Stripe keys to version control.

In Vercel, set environment variables under Project Settings → Environment Variables. Mark `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` as Production-only.
