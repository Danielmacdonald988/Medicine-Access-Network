# Organic discovery page review — 2026-10-30

## Intent and scope

Review-only changes against main `4a8aea525b9cf6ae8bcbc16bae3d50c1ec0e5bd8`:

- Preserve the existing resource articles and safety sources, adding focused guidance on psychedelic integration, first conversations, practical verification and spiritual-support fit.
- Add `/integration-support` for visitors ready to compare guides, distinct from the educational integration article. It queries current public listings through the shared directory query, matches current and legacy integration labels, shows up to six alphabetically and links to all matching results. No hardcoded guide count, names, availability or service-area claims.
- Cross-link articles/service page/directory, include the service page in the sitemap, and use its own canonical.
- Classify service-page visits using the existing coarse `directory_view` event. Do not add profile IDs, health information, raw search terms or URLs to events. Existing first-touch attribution and query-stripping remain unchanged. `search` pools search engines; it is not Google-only attribution. Controlled test traffic is not evidence of genuine seeker conversion.

These intent choices are editorial hypotheses, not verified keyword-demand estimates: the audited signed-in Google account did not have a Search Console property. No ranking or inquiry increase is promised.

## Canonical origin: deployment prerequisite, not a completed live fix

The live audit observed HTTP308 apex-to-www redirects, while canonicals and sitemap URLs still used apex. Change the fallback and `.env.example` to `https://www.thefacilitatornetwork.com`. This does **not** override a configured `NEXT_PUBLIC_APP_URL`.

Before an authorized release, inspect that variable in the intended environment and align it to the actual final hostname. Review auth redirect allowlists and email links that also depend on this shared origin; do not silently change them. After a separately authorized deploy, verify200 final URLs, self-canonicals, robots/sitemap origins and redirects. No environment, DNS, OAuth, Search Console, live database or production changes are included here.

## Acceptance checks before publication

- Desktop/mobile rendering, keyboard focus and anchor navigation; integration page → profile → Back preserves a useful page, repeated links never submit inquiries.
- With an authorized preview database: real public integration matches, legacy mappings, six-result limit/all-results link, removals, empty results and temporary failures. Check a non-English locale: English editorial copy is marked `lang=en`, guide cards use selected locale.
- Verify metadata, sitemap and canonical against the configured target origin.
- Do not submit real inquiries, create accounts or send email as part of these checks without separate authority.

No schema changes, external analytics expansion, new dependencies or sensitive contact collection are required. Publication/PR/merge/deployment remain separate decisions.
