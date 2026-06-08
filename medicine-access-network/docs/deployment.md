# Deployment Guide

## Vercel (recommended)

### Prerequisites
- Supabase project running (see `docs/supabase-setup.md`)
- GitHub/GitLab repository connected to Vercel

### Step 1 — Import project

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your repository
3. Framework preset: **Next.js** (auto-detected)
4. Do **not** change the build settings — defaults are correct

### Step 2 — Set environment variables

In Vercel → Project Settings → Environment Variables, add:

**Required (all environments):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL          ← your Vercel domain or custom domain
```

**Optional (production only when ready):**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_PRICE_PREPARATION_SESSION
STRIPE_PRICE_INTEGRATION_SESSION
STRIPE_PRICE_BREATHWORK_SESSION
STRIPE_PRICE_EDUCATION_SESSION
STRIPE_PRICE_FACILITATOR_SUBSCRIPTION
```

**Feature flags:**
```
NEXT_PUBLIC_PAYMENTS_ENABLED=false   ← keep false until Stripe is fully configured
```

### Step 3 — Deploy

Click **Deploy**. Vercel builds and deploys automatically.

After the first deployment:
1. Note your deployment URL (e.g. `https://medicine-access-network.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` to match
3. Update Supabase Auth redirect URLs to include this domain

### Step 4 — Set up Stripe webhook (when enabling payments)

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in Vercel
5. Set `NEXT_PUBLIC_PAYMENTS_ENABLED=true` once all price IDs are configured

---

## Custom domain

1. Vercel → Project → Domains → Add domain
2. Follow Vercel's DNS configuration instructions
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain
4. Update Supabase allowed redirect URLs

---

## Production checklist

### Before going live

- [ ] All required environment variables are set in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain
- [ ] Supabase Auth redirect URLs include the live domain
- [ ] RLS is enabled on all tables (verify in Supabase dashboard)
- [ ] First admin user is created and role is set in DB
- [ ] Email confirmations are enabled in Supabase Auth
- [ ] `NEXT_PUBLIC_PAYMENTS_ENABLED=false` unless Stripe is fully configured

### Security checks

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not exposed in client-side code
- [ ] `STRIPE_SECRET_KEY` is not exposed in client-side code
- [ ] No `.env.local` committed to version control (`.gitignore` should cover this)

### Monitoring

- [ ] Vercel Functions logs are accessible (Vercel Dashboard → Logs)
- [ ] Set up error alerts (Sentry, or Vercel's built-in monitoring)
- [ ] Review Supabase logs for any RLS policy failures

---

## CI/CD

Vercel automatically deploys:
- **Production** on push to `main`
- **Preview** on every pull request

To disable preview deployments: Vercel → Project → Git → Preview Deployments.

---

## Rollback

To rollback a bad deployment: Vercel → Deployments → select a previous deployment → Redeploy.
