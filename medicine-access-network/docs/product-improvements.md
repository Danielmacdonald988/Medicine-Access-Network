# Product improvements

The site helps a visitor find a suitable guide and start a conversation without making an account. The current implementation preserves the existing Next.js, Supabase and Vercel stack and incorporates the repository's account-free visitor architecture.

## Discovery and choice

The homepage gives visitors starting points based on the kind of support they want and explains what to discuss before agreeing to a session. The directory filters by support type, location, experience, online availability and donation-based pricing. Active filters can be removed individually; mobile filters collapse so results remain reachable.

Text filtering happens in the database before pagination. This fixes searches that previously missed matching guides beyond the first 50 loaded rows and produced counts unrelated to the search. User input is bounded, repeated parameters are normalized, and punctuation is searched literally. Result pages use a stable order and preserve filters. Empty and failed searches provide a recovery action and resource links.

Public queries use `facilitator_public_profiles`, which enforces approval and public visibility while excluding internal workflow fields. Directory review averages load separately using the guide's user identifier, avoiding the invalid direct profile-to-review relationship. A review-query failure does not hide the directory, and truncated review sets do not produce partial directory averages.

## Trust, accessibility and contact

“Profile reviewed” links to an explanation of administrator approval and its limits. It does not imply clinical licensure, independently verified claims or guaranteed outcomes. The site includes routes for platform contact and reporting concerns, with a clear distinction between platform support and emergency help.

Navigation, form labels, focus handling and touch targets were improved. Search fields follow URL changes during browser back/forward navigation. Contact errors retain entered text, and successful submission explains that a request is not a booking, creates no account and takes no payment.

The contact form supplies the required profile identifier through its actual initial form values. Previously, the identifier was added only after validation, so completing the visible fields could still fail validation without an editable field to correct. Regression tests now read the form's real defaults and validate them with the application's actual schema.

Names, email addresses and messages are shared with the selected guide and processed by the platform for delivery. The form asks visitors to leave out medical records and sensitive personal history. Email notifications are optional infrastructure; the saved request remains available in the guide dashboard when email delivery is unavailable.

## Publication and security

Administrator approval now sets `verification_status = approved` and `visibility = public` together. Pending or rejected decisions set hidden visibility. The action is labeled **Approve & publish**, published-guide counts reflect visibility, and the UI reports failed updates and optional-note failures accurately. A review note is written only after the publication update succeeds. Both JSON and HTML actions retain administrator authorization.

The database hardening keeps sensitive contact lookup and submission functions available only to the server role, revokes browser access to direct request insertion, and combines rate limiting with request creation. Contact logs do not include message contents or recipient details. The corrected public view maintains PostgreSQL's required column order across upgrades. See the migration files for the authoritative grants, policies and function definitions.

## Remaining operator decisions

- **Production database:** The repository changes are not evidence that migrations have run in the live Supabase project. Apply and verify the migration sequence in the [deployment guide](deployment.md). Existing profiles start hidden unless deliberately republished.
- **Secrets and delivery:** Configure production Supabase, server-role and email credentials; confirm the notification sender and support inbox. Test a real request using a controlled guide and visitor address. Sending a request and delivering its notification are distinct events.
- **Privacy policy and terms:** Public privacy and terms pages were absent; earlier footer links led to missing routes and have been removed. Formal documents still require operator decisions about identity, data retention and deletion, processors, contact handling, user rights, guide obligations and applicable jurisdiction. Interface disclosure is not a substitute for those policies. No policy text or legal compliance claim has been invented.
- **Review operations:** Define and maintain the actual administrator review criteria, evidence requirements and process for concerns or removal. The public copy deliberately describes only what the application demonstrably does.
- **Content maintenance:** Assign responsibility for reviewing educational and urgent-support information, checking external links and recording content review dates.
- **Payments:** Keep payments disabled. The new anonymous contact path does not book or charge for sessions. Legacy Stripe code and historical database records remain; enabling billing requires a separate validated product flow.
- **Scale:** Review Supabase row limits and indexing as the directory grows. Sitemap limits and review aggregation should be revisited when data exceeds configured response limits.

## Verification scope

Automated search tests cover the first-50 regression, database query parameters, count/pagination behavior, literal escaping, repeated/malformed parameters, rating association and review failures. Contact tests validate real form defaults and acknowledgement requirements. Admin route tests cover publish/hide updates, authorization, failed updates and HTML feedback.

The contact and search browser checks confirmed mobile validation labels and acknowledgement behavior, preservation of messages after a local submission failure, and mobile filter/back-navigation state. The database regression suite separately passed 78 assertions across a fresh schema, the existing-database upgrade sequence, and repeated migration 0004.

The application tests use controlled inputs and mocked external services; the database suite uses a local PostgreSQL-compatible test runtime. Lint and TypeScript checks also passed. No production Supabase migration, live-production contact submission, or external email-delivery test was performed. Operator policies remain separate decisions.
