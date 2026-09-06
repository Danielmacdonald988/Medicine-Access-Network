# Environment and launch configuration

Copy `.env.example` to `.env.local` for development. Never commit credentials.

## Production configuration

Set these in the Vercel project, scoped to **Production**:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical HTTPS origin, with no path/query/fragment. Change only after the new domain and certificate work. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project HTTPS URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public browser key. Database row/column permissions remain the security boundary. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only contact submission credential. Never expose it through a `NEXT_PUBLIC_` variable or client code. |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | Keep `false`. Checkout and webhook processing are disabled for this launch. |
| `RESEND_API_KEY` | Server-only email-sending key restricted to the verified sender domain. |
| `RESEND_FROM_EMAIL` | Sender address on the verified Resend domain. |
| `CONTACT_RATE_LIMIT_SECRET` | Optional independent secret for contact-rate key hashing; otherwise the server credential is used. |

When `VERCEL_ENV=production`, invalid required configuration fails the build. Local/CI builds may use placeholder public settings and do not require production credentials. A successful build with missing Resend configuration warns that email notifications will not be sent; inquiries still persist in facilitator dashboards.

## Domain change

1. Register the selected domain and attach it to the Vercel project.
2. Verify DNS and HTTPS before changing the canonical app URL.
3. Add the new exact callback URL in Supabase Authentication > URL Configuration, including the password-reset callback query, and change its Site URL.
4. Set `NEXT_PUBLIC_APP_URL` to the new canonical origin and redeploy. Update the fallback origin in `lib/constants.ts` when making the domain permanent.
5. Redirect the alternate `www`/apex host and the old production alias to the canonical host. Preserve paths and query strings, including authentication callbacks.
6. Verify page canonicals, sitemap, robots, email confirmation and password reset from the new host. Existing sessions on the previous host do not transfer to another domain; facilitators may need to sign in again.
7. Verify the domain in Google Search Console and submit its sitemap. Indexing and displayed search titles are controlled by Google and are not guaranteed immediately.

## Two separate email paths

- **Supabase custom SMTP** sends account confirmation and password-reset emails. Configure this separately in the Supabase dashboard. Its default test sender cannot deliver to arbitrary new facilitator addresses.
- **Resend API** sends inquiry notifications. Configure the two Vercel variables above after verifying the sender domain's DNS records. The visitor's email is used as Reply-To.

Use the provider's exact DNS values for DKIM/SPF and configure DMARC. Keep click/open tracking disabled for account messages so authentication links are not rewritten. Keep email confirmation enabled. Set practical email rate limits for the invited cohort and the provider's sending quota.

Test confirmation, password reset, an authorized inquiry, notification receipt, and a reply before distributing invitations. Provider acceptance alone does not establish inbox delivery. Failed notifications leave the inquiry in the dashboard; automatic retry is not implemented in this release.

## Monitoring and recovery

`GET /api/health` returns 200 or 503 after a bounded anonymous read of the public directory. It exposes no private records or configuration. It verifies core connectivity and configuration presence, not actual contact writes, credential validity, SMTP or inbox delivery.

Configure an external uptime monitor to check the endpoint and alert the operator. Keep backups and test restoration in a separate database. Supabase Free can pause inactive projects; use an appropriate production plan for continuous availability. Keep spending controls enabled and review the bill before activating additional projects or services.

No database migrations are required for the launch-hardening application changes. Migrations 0001–0004 must already be applied. Roll back only to an application version compatible with those database permissions. The previous production commit is recorded in the release notes.

## Payments

Payments remain disabled and production builds reject enabling them. The legacy enabled webhook needs a separate implementation/review of trusted database writes, error handling, idempotency and the actual service's payment-provider eligibility before activation.
