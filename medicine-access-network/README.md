# Medicine Access Network

A trusted discovery and matching platform for plant medicine facilitators, integration guides, breathwork practitioners, somatic workers, and preparation coaches.

This is **not a drug marketplace**. The platform coordinates legal support services only — education, preparation coaching, integration guidance, breathwork, and somatic work. It does not sell, distribute, source, or facilitate access to controlled substances.

---

## What it does

- **Seekers** browse verified facilitator profiles, filter by modality, location, and format, and send conversation requests
- **Facilitators** apply, get reviewed by admins, receive booking requests, and collect reviews
- **Admins** review facilitator applications and manage the platform
- **Safety Library** — 7 grounded articles on preparation, integration, red flags, contraindications, and emergencies

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth + DB | Supabase (Postgres, Auth, RLS) |
| Payments | Stripe (infrastructure built, disabled by default) |
| Deployment | Vercel |

## Quick start

```bash
# 1. Clone
git clone <repo-url>
cd medicine-access-network

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local — fill in Supabase keys at minimum

# 4. Run the Supabase schema
# See docs/supabase-setup.md

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

| Document | Purpose |
|---|---|
| [docs/supabase-setup.md](docs/supabase-setup.md) | Database setup and RLS configuration |
| [docs/environment-variables.md](docs/environment-variables.md) | All environment variables explained |
| [docs/deployment.md](docs/deployment.md) | Vercel deployment guide |

## Project structure

```
app/
  (dashboard)/          # Auth-gated role dashboards
    seeker/             # Seeker dashboard + review flow
    facilitator/        # Guide dashboard
    dashboard/          # Role-based redirect dispatcher
  admin/                # Admin verification dashboard
  api/                  # Route handlers
    booking-requests/   # CRUD + status updates
    reviews/            # Review submission
    stripe/             # Checkout + webhook (inactive)
    admin/facilitators/ # Admin approve/reject
  facilitators/         # Public guide directory + profiles
  onboarding/           # Multi-step onboarding forms
  resources/            # Safety Library (7 articles)
components/
  forms/                # React Hook Form + Zod forms
  layout/               # Navbar, Footer, ResourceNav
  ui/                   # shadcn/ui components
lib/
  auth.ts               # requireAuth, requireRole helpers
  constants.ts          # Modalities, support types, labels
  payments.ts           # Feature flag + pricing catalog
  resources.ts          # Safety Library content
  stripe.ts             # Stripe server utilities (server-only)
  env.ts                # Environment variable validation
  analytics.ts          # Analytics stub
db/
  schema.sql            # Full Postgres schema + RLS policies
```

## Legal notes

- No payment may be labeled as payment for medicine, substances, ceremonies, or illegal services
- All facilitator profiles require admin review before appearing publicly
- The platform does not provide medical advice, diagnosis, or treatment
- See `docs/legal-language.md` for approved terminology
