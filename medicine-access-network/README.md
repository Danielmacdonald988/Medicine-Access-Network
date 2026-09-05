# The Facilitator Network

A directory for preparation coaches, integration guides, breathwork practitioners, and somatic support. The platform lists legal education and wellness services; it does not sell or source controlled substances or provide medical treatment.

## How it works

- Visitors browse public profiles, compare support, location, online availability, and pricing, and request a conversation without creating an account.
- A conversation request shares the visitor's name, email, and brief message with the chosen guide. It does not book a session or take payment.
- Guides create an account, submit an application, and manage incoming requests in their dashboard. Email notifications require configured delivery credentials.
- Administrators review applications. **Approve & publish** makes a profile public; pending or rejected profiles remain hidden. Profile review is not independent clinical credentialing or a guarantee of outcomes.
- The resource library offers educational guidance on preparation, integration, boundaries, and urgent support.

New seeker accounts, seeker onboarding, and the seeker dashboard have been removed. Legacy database records remain for existing requests and reviews.

## Stack

| Layer | Technology |
|---|---|
| Application | Next.js 16 App Router, React, TypeScript |
| Interface | Tailwind CSS, shadcn/ui and Base UI components |
| Identity and data | Supabase Auth, PostgreSQL and row-level security |
| Inquiry notifications | Resend HTTP API |
| Hosting | Existing Vercel project |
| Payments | Legacy Stripe infrastructure; disabled by default |

## Development

Run commands from this `medicine-access-network` directory.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set Supabase credentials in `.env.local` and prepare a development database using [the deployment guide](docs/deployment.md). Anonymous contact submission also needs a server-only service-role credential. Without a configured database, public pages can render but the directory and account/contact features cannot be validated end to end.

Open [localhost:3000](http://localhost:3000). Keep secrets out of source control.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
node --test tests/contact-request-form.test.mjs tests/admin-publication.test.mjs
npx tsc tests/facilitator-search.test.ts --module commonjs --moduleResolution node --target es2020 --esModuleInterop --skipLibCheck --outDir node_modules/.cache/search-tests
node --test "$PWD/node_modules/.cache/search-tests/tests/facilitator-search.test.js"
```

The search tests use mocked database responses to check query construction, pagination and review behavior. Contact and admin tests exercise the actual form configuration/schema and route code. They do not replace a production database, email-delivery or browser acceptance check.

## Key paths

| Path | Purpose |
|---|---|
| `app/facilitators/` | Public directory and profiles |
| `app/api/contact-requests/` | Account-free conversation requests |
| `app/(dashboard)/facilitator/` | Guide dashboard |
| `app/admin/` | Admin review and publication |
| `app/onboarding/facilitator/` | Guide application |
| `app/resources/` | Educational resources |
| `app/about/`, `app/contact/` | Review explanation and platform contact |
| `lib/facilitator-search.ts` | Shared validated search and rating queries |
| `db/schema.sql`, `db/migrations/` | Fresh database setup and existing-database upgrades |

## Documentation

- [Product improvements and remaining operator decisions](docs/product-improvements.md)
- [Deployment and operational prerequisites](docs/deployment.md)
- [Environment variables](docs/environment-variables.md)
- [Supabase setup](docs/supabase-setup.md)

The older product specification describes the original account-based MVP. Use the current application and the product-improvements document for the account-free visitor flow.
