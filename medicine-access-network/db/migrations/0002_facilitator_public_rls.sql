-- ============================================================================
-- Migration 0002: anon-safe RLS + public-profile view
-- Depends on migration 0001 (verification_status 'suspended', visibility column).
--
-- DO NOT RUN AGAINST PRODUCTION YET — review first.
--
-- Design summary:
--   - `anon` gets COLUMN-restricted, ROW-restricted access to
--     facilitator_profiles: only the safe columns, only rows where
--     verification_status = 'approved' AND visibility = 'public'.
--   - A `security_invoker` view (facilitator_public_profiles) re-exposes
--     that same safe slice under a clean name, so app code never has to
--     remember the column allowlist or re-derive the row filter. Because
--     it's security_invoker, the view carries NO privilege of its own —
--     it runs as whichever role queries it, so it's exactly as safe (or
--     unsafe) as the underlying grants/policies below. If this project's
--     Postgres version predates security_invoker views (< PG15), the
--     WHERE clause baked into the view is a second, independent barrier
--     that holds regardless — see the note above the CREATE VIEW.
--   - public.users gets a blanket REVOKE from anon (table-level, not just
--     RLS) — belt-and-suspenders per the explicit ask to confirm it's
--     unreachable.
--   - Also fixed along the way: "users: service role insert" had
--     `with check (true)` and no `to` clause, meaning any anon or
--     authenticated caller could currently INSERT arbitrary rows into
--     public.users (see prior audit, §3). Replaced with a scoped
--     self-heal policy matching what lib/auth.ts's getCurrentUser()
--     actually does (a logged-in user upserting their own row only).
-- ============================================================================

-- ─── 1. facilitator_profiles: lock down anon to a column + row allowlist ──────

revoke all on public.facilitator_profiles from anon;

grant select (
  id,
  display_name,
  bio,
  location,
  remote_available,
  modalities,
  years_experience,
  lineage_or_training,
  certifications,
  safety_practices,
  contraindications_acknowledged,
  donation_based,
  minimum_donation,
  hourly_rate,
  avatar_url
) on public.facilitator_profiles to anon;

-- Explicitly NOT granted to anon: user_id (links to auth identity),
-- verification_status, visibility (internal workflow state),
-- created_at, updated_at. There is no email/phone/address column on this
-- table today — if one is ever added, it must be left out of both this
-- grant and the view below.

create policy "facilitator_profiles: anon reads approved+public"
  on public.facilitator_profiles for select
  to anon
  using (verification_status = 'approved' and visibility = 'public');

-- The pre-existing "approved are public" policy had no `to` clause (so it
-- already covered anon) and didn't check visibility at all. Anon now has
-- its own dedicated policy above with the column grant attached to it, so
-- scope the old one to `authenticated` only and bring it in line with the
-- new visibility rule — otherwise a logged-in non-owner (e.g. one
-- facilitator browsing another's profile) could still see full rows,
-- including hidden/unlisted ones, through the old policy.
alter policy "facilitator_profiles: approved are public"
  on public.facilitator_profiles
  to authenticated
  using (verification_status = 'approved' and visibility = 'public');

-- ─── 2. Public-safe view ────────────────────────────────────────────────────
-- security_invoker = true (PG15+): this view has no privileges of its own.
-- It runs as the querying role, so anon only ever sees what the grant/policy
-- pair above allows — the WHERE clause here is a second, redundant filter,
-- not the only one. If security_invoker isn't available on your Postgres
-- version, this still returns only the listed columns (a view's column list
-- is fixed by its definition regardless of invoker/definer semantics) and
-- the WHERE clause still applies — you would only lose the guarantee that
-- row access is re-checked against the *querying* role rather than the
-- view's owner. Confirm your Supabase project's Postgres version before
-- relying on that distinction.

create view public.facilitator_public_profiles
  with (security_invoker = true) as
select
  id,
  display_name,
  bio,
  location,
  remote_available,
  modalities,
  years_experience,
  lineage_or_training,
  certifications,
  safety_practices,
  contraindications_acknowledged,
  donation_based,
  minimum_donation,
  hourly_rate,
  avatar_url
from public.facilitator_profiles
where verification_status = 'approved'
  and visibility = 'public';

comment on view public.facilitator_public_profiles is
  'Anon-safe, column- and row-restricted view of facilitator_profiles. '
  'Use this (not the base table) for all unauthenticated reads — search, '
  'browse, and profile detail pages. Excludes user_id, verification_status, '
  'visibility, and timestamps. security_invoker = true: carries no '
  'privilege of its own, see comment above the CREATE VIEW statement.';

grant select on public.facilitator_public_profiles to anon, authenticated;

-- ─── 3. Confirm public.users is unreachable by anon ────────────────────────
-- Existing SELECT/UPDATE policies already require auth.uid() = id or
-- get_my_role() = 'admin', both of which are false/null for anon (no
-- session, no auth.uid()) — so anon already got 0 rows from SELECT. This
-- revoke makes that true at the grant level too, independent of whether the
-- RLS policies stay correct over time.

revoke all on public.users from anon;

-- Fix the insert policy that undermined the above: `with check (true)` and
-- no `to` clause meant this previously applied to anon as well (assuming a
-- default table grant existed) and let ANY caller insert a users row with
-- any role, including 'admin'. lib/auth.ts's getCurrentUser() self-heal
-- only ever needs to upsert the CALLING user's own row, so scope it to
-- that.
drop policy "users: service role insert" on public.users;

create policy "users: self-heal insert own row"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

-- The on_auth_user_created trigger (public.handle_new_user) is
-- `security definer` and bypasses RLS entirely, so normal signup is
-- unaffected. Seed/migration scripts run as the postgres/service role,
-- which also bypasses RLS, so db/seed.sql is unaffected too.
