-- ============================================================================
-- Migration 0001: facilitator status + visibility
-- Part of the seeker-account-removal / public-browsing migration.
--
-- DO NOT RUN AGAINST PRODUCTION YET — review first.
--
-- What this does:
--   1. Extends the existing `verification_status` enum with 'suspended'.
--      (A status field already existed — `facilitator_profiles.verification_status`
--      — so this extends it rather than adding a second, competing status
--      column. Renaming it was considered and rejected: the column name is
--      referenced throughout the app and RLS policies, and a rename buys
--      nothing functionally.)
--   2. Adds a new `visibility` enum + column: 'public' | 'unlisted' | 'hidden',
--      defaulting to 'hidden'.
--   3. Adds a composite index to support the public-listing query
--      (status = 'approved' AND visibility = 'public'), used by the RLS
--      policy and view added in migration 0002.
--
-- IMPORTANT — read before running:
--   `visibility` defaults to 'hidden' for every row, including facilitators
--   that are already `verification_status = 'approved'` and currently live
--   on the public site today. Running this migration as-is will make every
--   existing approved facilitator disappear from public listings until you
--   (or an admin action) explicitly sets visibility = 'public' per profile.
--
--   A commented-out backfill statement is included at the bottom that sets
--   visibility = 'public' for all currently-approved profiles, preserving
--   today's visible set. Uncomment it if you want continuity; leave it
--   commented if you want every facilitator to start hidden and be
--   re-published deliberately. This is your call — I have not run this.
-- ============================================================================

-- ─── 1. Extend verification_status with 'suspended' ───────────────────────────
-- NOTE: ALTER TYPE ... ADD VALUE cannot be used in the same transaction as a
-- statement that reads the new value, and (pre-PG12 restriction aside) some
-- pooled/PgBouncer connections used by the Supabase SQL editor still want
-- this run as its own statement. Run this block first, on its own, before
-- anything below that references 'suspended'.

alter type verification_status add value if not exists 'suspended';

-- ─── 2. New visibility enum + column ───────────────────────────────────────────

create type facilitator_visibility as enum ('public', 'unlisted', 'hidden');

alter table public.facilitator_profiles
  add column if not exists visibility facilitator_visibility not null default 'hidden';

comment on column public.facilitator_profiles.visibility is
  'Publisher-controlled visibility, independent of verification_status. '
  'A profile is only public when verification_status = ''approved'' AND '
  'visibility = ''public''. ''unlisted'' = reachable by direct link but not '
  'in search/browse (reserved for future use). ''hidden'' = not shown '
  'anywhere outside the owning facilitator/admin.';

-- ─── 3. Composite index for the public-visibility query ────────────────────────
-- Supports: where verification_status = 'approved' and visibility = 'public'

create index if not exists facilitator_profiles_public_visibility_idx
  on public.facilitator_profiles (verification_status, visibility)
  where verification_status = 'approved' and visibility = 'public';

-- ─── Optional backfill — see note above. Commented out on purpose. ─────────────
-- update public.facilitator_profiles
-- set visibility = 'public'
-- where verification_status = 'approved';
