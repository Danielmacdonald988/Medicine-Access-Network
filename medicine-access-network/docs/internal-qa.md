# Internal QA without analytics pollution

Prefer preview deployments for functional QA. For necessary production browser checks, open the first page with `?tfn_qa=1` (or `&tfn_qa=1` if it already has a query). Example: `https://www.thefacilitatornetwork.com/?tfn_qa=1`.

This explicit flag excludes both TFN coarse engagement and Vercel Web Analytics before events are sent. It stores only `tfn-internal-qa=1` in the current tab's sessionStorage. It does not create a tracking identifier, send an exclusion event, change visitor defaults, authenticate anyone, or alter data retention. Other tabs need their own QA opt-out; duplicated tabs may inherit sessionStorage. Do not share QA links as marketing links.

Keep QA in that tab. Use `?tfn_qa=0` to clear the flag before an intentional ordinary-visit test, or close the QA tab. If sessionStorage is blocked, the explicit flag excludes only pages whose URL contains `tfn_qa=1`; use preview instead for multi-page QA rather than assuming exclusion persists. Enable QA before opening the first production page. Events still queued by TFN are checked again before sending, but requests already in flight cannot be retracted. Clearing the flag is best-effort when browser storage is blocked; do not assume a previous stored flag was removed. Analytics already sent cannot be removed by this flag or reliably identified as historical QA.

Verification: in browser network tools confirm no requests to `/api/engagement` or Vercel analytics event endpoints are sent while navigating. Do not submit real inquiries, send notifications, or change stored user records as part of analytics checks.

Existing DNT/GPC and admin/preview exclusions for TFN coarse analytics are unchanged. Do not assume those alone exclude a separate analytics product. Server access logs and infrastructure/security logs are outside this client analytics control.
