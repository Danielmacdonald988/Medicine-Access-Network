# Deployment and operations

The application continues to use Next.js, Supabase and the existing Vercel project. Run the application from the repository's `medicine-access-network` directory; confirm that the Vercel project's Root Directory points there. No hosting migration is required.

## Database preparation

Use a separate development or preview database to verify these changes before applying them to production. A successful frontend build does not establish that the live database has the required schema or permissions.

For an **existing database**, review and apply these migrations in order:

1. `db/migrations/0001_facilitator_status_visibility.sql`
2. `db/migrations/0002_facilitator_public_rls.sql`
3. `db/migrations/0003_contact_without_account.sql`
4. `db/migrations/0004_authorization_and_contact.sql`
5. `db/migrations/0005_profile_media_links.sql`
6. `db/migrations/0006_admin_application_notifications.sql`

Apply the full sequence before switching traffic to the new code; the public directory depends on the final `facilitator_public_profiles` view and contact submission depends on the hardened server-only RPCs. The intermediate files contain historical warnings and compatibility corrections. Do not re-run old non-idempotent migrations against a database where they are already installed. Files ending in `.verify.sql` are diagnostic scripts, not numbered upgrade steps.

For a **fresh database**, use the current `db/schema.sql`, which includes migrations 0001–0006. Do not also run those migrations on the same fresh database. Do not assume a Supabase CLI reset automatically reads `db/schema.sql`; this repository does not use the CLI's default `supabase/migrations` layout.

Migration 0001 defaults profile visibility to `hidden`, including previously approved guides. Deliberately choose which existing approved profiles to republish; do not bulk-publish them without that decision. The admin **Approve & publish** action writes approval and public visibility together. Pending and rejected decisions write hidden visibility. The admin dashboard counts only approved, public profiles as published.

Verify that anonymous visitors can read only approved, public profiles; cannot read private users or requests; cannot call server-only contact/rate-limit functions; and cannot promote their own role or publication status. Also verify that administrators can publish and that a guide can read their own requests. Do not rely on a browser button being hidden as an authorization boundary.

## Environment configuration

Set each environment's values in Vercel and use its own Supabase project and secrets where possible.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for public queries and guide authentication |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key; access remains constrained by database grants and policies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only anonymous contact delivery; never prefix with `NEXT_PUBLIC_` or expose it to browsers |
| `NEXT_PUBLIC_APP_URL` | Canonical production origin, used by metadata, sitemap and auth redirects |
| `RESEND_API_KEY` | Server-only credential for facilitator inquiries and admin application alerts |
| `RESEND_FROM_EMAIL` | Sender address configured with the email provider |
| `ADMIN_NOTIFICATION_EMAIL` | Application-review inbox; separate from the facilitator inquiry recipient and public support address |
| `CONTACT_RATE_LIMIT_SECRET` | Optional separate secret for keyed IP hashing; the service key is the fallback |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | Keep `false`; anonymous conversation requests do not invoke Stripe |

Without email configuration or if delivery fails, a saved request remains available in the guide dashboard. The visitor receives confirmation of receipt, not a promise that an email was delivered or a guide will respond. Inquiry emails do not have automatic retry. Application alerts use the private queue installed by migration 0006, with an immediate attempt after submission and an admin-only manual retry for eligible messages. Edits within the 15-minute cooldown remain queued; no scheduled worker is installed. Preview deployments cannot dispatch these admin alerts. See [email configuration](environment-variables.md#two-separate-email-paths) for delivery limits.

Configure Supabase's Site URL and allowed authentication callback URLs for the intended production and preview origins. Accounts are for guides and administrators; visitors do not need to sign in. Confirm the administrator role through the trusted database administration process, never through client-supplied signup metadata.

Production rate limiting relies on Vercel's trusted client-IP headers. If hosting behind another proxy, explicitly review how that host sets and sanitizes these headers before accepting contact submissions there.

## Release validation

Run the checks in the README. Then validate against the prepared preview database:

- An approved, public profile appears in the directory, profile page and sitemap. Hidden and unapproved profiles do not.
- Search, combined filters, empty results, pagination and browser back/forward work on desktop and mobile.
- An anonymous visitor can complete all visible contact fields and submit without an account. The request appears only in the intended guide's dashboard, and configured email delivery reaches that guide.
- Invalid input, unavailable profiles and rate-limited requests produce useful feedback without clearing the visitor's message.
- A non-admin cannot publish a profile. An admin's approval publishes it; rejection or pending status hides it. Failed changes display an error.
- Guide signup, confirmation, login and password reset return to the correct guide flow.
- A separate, confirmed administrator account opens `/admin`; normal guide accounts cannot. A submitted application queues one minimal alert for the configured admin inbox. Test provider acceptance and inbox receipt separately, then verify the authenticated retry action without sending visitor messages.
- The support email in `lib/constants.ts` is the operator's monitored inbox.

Review [the remaining operator decisions](product-improvements.md#remaining-operator-decisions), including privacy and terms, before treating the public contact flow as production ready.

Deploy through the existing Vercel/Git workflow after the database and environment are ready. Keep the previous deployment available for application rollback, but account for database compatibility: rolling back code does not undo schema, grant or policy changes. Record migration execution and any deliberate profile republication separately.
