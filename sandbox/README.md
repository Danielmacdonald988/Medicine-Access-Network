# Facilitator Network design sandbox

An isolated, interactive implementation of the approved search-page concept. Includes search, category/location/format filters, sorting, profile dialogs, simulated inquiries, and a short checkbox application with a preview step. All profiles are fictional. This is a design sandbox, not a full staging clone of authenticated production functionality.

## Run locally

Node 22, no package dependencies or install required:

```sh
cd sandbox
npm test
npm start
```

Open http://127.0.0.1:4173. The local server binds only to loopback. Forms are in-memory simulations: no database writes, email, auth accounts, payments, analytics, external fonts, or production API calls. Refresh resets the UI. Do not enter real personal information. Hosting access logs may still exist.

## Deploy separately on Vercel

1. Create a NEW project `facilitator-network-sandbox` from this repository, branch `sandbox/facilitator-preview`.
2. Set Root Directory to `sandbox` (not `medicine-access-network`). Framework: Other. Leave Build Command empty; output directory `public`; use the committed configuration.
3. Configure a unique server-only `SANDBOX_PASSWORD` of at least 20 characters for each deployed environment, including Production in this separate project. Do not reuse any production password or import production environment variables. HTTP Basic username is `reviewer`. Share credentials privately; never commit them.
4. Enable Vercel Deployment Protection as well. Use HTTPS. Use the generated sandbox domain; do not attach the live domain. Inspect project-level firewall/rate-limit options before sharing beyond the owner.
5. Deploy, verify that unauthenticated requests to the page and assets are rejected, then log in and test filtering and simulated forms. Missing/short password yields 503, not a public page.

The existing application's `vercel.json` skips automatic builds on this exact sandbox branch to avoid deploying the production-connected app as the sandbox. It does not affect main. Confirm Vercel Root Directory and existing dashboard overrides before deployment. A root-directory mismatch must be resolved rather than adding production credentials.

All assets are served through a password-gated handler; no UI files are in the public output folder. CSP blocks outbound browser connections and form submissions. POST/PUT/PATCH/DELETE are rejected. No secrets are bundled into the client. Policy dialogs are clearly draft/test notices, not approved legal documents.

## Release boundary

Do not merge this branch as a production design release. Port approved components/copy into the actual Next.js app on a separately reviewed branch after inspecting its data and auth flows. Full end-to-end staging would require a separately provisioned database/auth/storage/email configuration and additional tests. This sandbox has no such resources and never copies production user records.

## Validation

`npm test` checks hosted lockout, authentication of assets, rejection of writes/unknown endpoints, no-index/CSP headers, and absence of client network/persistent-storage calls. Local HTTP checks verify asset delivery. Vercel-specific deployment and interactive browser review must be completed after account connection.
