-- ============================================================================
-- Migration 0003: contact-without-an-account
-- Depends on migrations 0001 and 0002.
--
-- DO NOT RUN AGAINST PRODUCTION YET — review first.
--
-- What this does:
--   1. Corrects TWO issues in migration 0002 (flagging both explicitly
--      rather than silently editing an already-reviewed file):
--      1a. The public view excluded user_id and timestamps, which broke
--          legitimate, already-public functionality (see note below).
--      1b. A real bug: migration 0002 restricted anon to a specific column
--          list on facilitator_profiles, but left THREE places — the
--          view's own WHERE clause, the "anon reads approved+public" RLS
--          policy, and the pre-existing facilitator_modalities public-read
--          policy — referencing verification_status/visibility directly.
--          Evaluating those references requires SELECT privilege on those
--          columns, which anon does NOT have (deliberately). As written,
--          every one of those would fail with a permission error for
--          anon, not just return zero rows — i.e. public browsing would
--          have been completely broken the moment 0002 was applied. Fixed
--          by introducing a SECURITY DEFINER helper function, the same
--          pattern get_my_role() already uses elsewhere in this schema to
--          solve the identical class of problem.
--   2. Makes booking_requests accept anonymous submissions: seeker_id
--      becomes nullable, seeker_name/seeker_email are added, and a check
--      constraint guarantees every row can still be traced to *someone*.
--   3. Replaces the old "authenticated seeker" insert policy with an
--      anon-safe one, restricted to exactly the columns the new contact
--      route needs.
--   4. Adds a self-cleaning IP rate-limit table + SECURITY DEFINER function
--      (anon gets EXECUTE on the function only, never direct table access
--      — see the rate-limiting design note below for why raw table access
--      can't be safely RLS-scoped for this use case).
--   5. Adds a SECURITY DEFINER function that resolves a *public*
--      facilitator_profiles.id to the contact info the new route needs
--      (their auth user id, to store as booking_requests.facilitator_id,
--      and their email, to send the notification) — without ever letting
--      anon query public.users directly. Returns zero rows for anything
--      that isn't approved+public, so it can't be used to probe arbitrary
--      ids or find out-of-workflow facilitators exist.
-- ============================================================================

-- ─── 1a. Correction: view needs user_id + created_at ───────────────────────
-- Migration 0002 excluded `user_id` and the timestamps from the public view
-- on the reasoning that user_id is "a link to auth identity." In practice
-- that broke two legitimate, already-public things: (a) the facilitator
-- detail page needs user_id to look up that facilitator's reviews
-- (reviews.facilitator_id -> users.id — reviews are ALREADY fully public
-- read, `reviews: public read` uses `using (true)`), and (b) created_at is
-- needed for "newest guides first" sort ordering on the browse page.
--
-- Re-examined: user_id is an opaque UUID with no privilege attached once
-- public.users is locked down (which it is, as of 0002) — it cannot be used
-- to read anything about the facilitator that isn't already exposed here,
-- and it doesn't let anyone query auth.users or public.users (both
-- unreachable by anon regardless of knowing the id). verification_status
-- and visibility stay excluded — those are genuinely internal workflow
-- state with no public-facing purpose, which is the category the original
-- ask meant to exclude.

grant select (user_id, created_at) on public.facilitator_profiles to anon;

-- ─── 1b. Correction: column-privilege bug in three places ──────────────────
-- SECURITY DEFINER bypasses the CALLER's column privileges for the query
-- inside the function body (it runs as the function's owner, who owns
-- these tables and so isn't subject to their RLS/column grants at all —
-- exactly how get_my_role() already safely queries public.users from
-- inside policies on public.users without recursion or privilege errors).
-- Only ever takes/returns values anon already has legitimate access to.

create or replace function public.is_facilitator_profile_public(
  p_facilitator_profile_id uuid
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.facilitator_profiles fp
    where fp.id = p_facilitator_profile_id
      and fp.verification_status = 'approved'
      and fp.visibility = 'public'
  );
$$;

grant execute on function
  public.is_facilitator_profile_public(uuid)
  to anon, authenticated;

-- Fix 1: the view. `id` is a column anon already has SELECT on, so calling
-- the function with it (rather than referencing verification_status /
-- visibility directly) is what makes this legal under security_invoker.
create or replace view public.facilitator_public_profiles
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
  avatar_url,
  user_id,
  created_at
from public.facilitator_profiles
where public.is_facilitator_profile_public(id);

-- Fix 2: the RLS policy for direct anon reads of the base table (in case
-- anything ever queries facilitator_profiles directly instead of through
-- the view — e.g. raw PostgREST access with the anon key).
alter policy "facilitator_profiles: anon reads approved+public"
  on public.facilitator_profiles
  using (public.is_facilitator_profile_public(id));

-- Fix 3: facilitator_modalities' pre-existing public-read policy (from the
-- original schema.sql, not something 0002 added) has the exact same shape
-- of problem — its `exists (...)` subquery reads
-- facilitator_profiles.verification_status directly. Nothing in the app
-- queries facilitator_modalities today (it's a write-side source of truth
-- for the denormalized facilitator_profiles.modalities array, kept in sync
-- by a trigger — see schema.sql), so this was a dormant bug, not an active
-- one, but it's the same class of mistake and worth closing now that it's
-- been found.
alter policy "facilitator_modalities: public read"
  on public.facilitator_modalities
  using (public.is_facilitator_profile_public(facilitator_id));

-- ─── 2. booking_requests: allow anonymous submissions ──────────────────────

alter table public.booking_requests
  alter column seeker_id drop not null;

alter table public.booking_requests
  add column if not exists seeker_name text,
  add column if not exists seeker_email text;

alter table public.booking_requests
  add constraint booking_requests_identity_check
  check (
    seeker_id is not null
    or (seeker_name is not null and seeker_email is not null)
  );

comment on column public.booking_requests.seeker_id is
  'Null for anonymous contact submissions (the normal case going forward —
   seekers have no accounts). Populated only on legacy rows from the old
   authenticated-seeker flow.';
comment on column public.booking_requests.seeker_name is
  'Set on anonymous contact submissions. Null on legacy authenticated rows.';
comment on column public.booking_requests.seeker_email is
  'Set on anonymous contact submissions — this is the only way the
   facilitator can reply. Never expose this column, or this table, to
   anon SELECT; see the grants below.';

-- ─── 3. RLS: replace the authenticated-seeker insert policy ────────────────

drop policy if exists "booking_requests: seekers create" on public.booking_requests;

revoke all on public.booking_requests from anon;

grant insert (
  facilitator_id,
  requested_service,
  message,
  preferred_format,
  preferred_time_window,
  seeker_name,
  seeker_email
) on public.booking_requests to anon;

-- Helper for the policy below: anon only has column-level SELECT on
-- facilitator_profiles for the public-safe columns (see 0002) — it does
-- NOT have SELECT on verification_status or visibility, on purpose. A
-- policy's USING/WITH CHECK expression is evaluated with the querying
-- role's own column privileges, so a raw correlated subquery against those
-- two columns would fail with a permission error for anon, not just
-- return false. This is exactly the problem get_my_role() already solves
-- for role checks elsewhere in this schema (see schema.sql) — same fix,
-- applied here: a SECURITY DEFINER function bypasses the caller's column
-- privileges internally, while still only ever returning a boolean.
create or replace function public.is_publicly_reachable_facilitator(
  p_user_id uuid
) returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.facilitator_profiles fp
    where fp.user_id = p_user_id
      and fp.verification_status = 'approved'
      and fp.visibility = 'public'
  );
$$;

grant execute on function
  public.is_publicly_reachable_facilitator(uuid)
  to anon, authenticated;

create policy "booking_requests: anonymous contact submissions"
  on public.booking_requests for insert
  to anon
  with check (
    seeker_id is null
    and seeker_name is not null
    and seeker_email is not null
    -- facilitator_id must point at a facilitator who is actually publicly
    -- reachable right now — this is the RLS-layer backstop behind the
    -- get_facilitator_contact_info() check the API route already does;
    -- belt-and-suspenders in case the route is ever called incorrectly.
    and public.is_publicly_reachable_facilitator(facilitator_id)
  );

-- Note: the existing "booking_requests: parties can read" and "facilitators
-- update status" policies are untouched and still correct — a facilitator
-- reads/updates their own incoming requests via auth.uid() = facilitator_id
-- exactly as before. Anonymous submitters have no session and were never
-- meant to read their submission back (this is a fire-and-forget form, not
-- a dashboard) — no anon SELECT policy is added, intentionally: this is
-- also what keeps other people's seeker_name/seeker_email unreadable by
-- anon.

-- ─── 4. IP rate limiting ────────────────────────────────────────────────────
-- Design note: a rate-limit table queried directly by the anon client can't
-- be safely RLS-scoped to "only see attempts from my own IP" — there's no
-- session/auth.uid() to check that claim against, so any anon caller could
-- pass any IP string as a filter and read (or manipulate) another visitor's
-- attempt count. Instead, anon gets EXECUTE on a SECURITY DEFINER function
-- that takes the IP (which the *route handler* determines from trusted
-- request headers, not from anything the client asserts) and does the
-- count-check-and-record atomically server-side. No direct table grant to
-- anon at all.

create table public.contact_rate_limits (
  id          uuid primary key default uuid_generate_v4(),
  ip_address  text not null,
  created_at  timestamptz not null default now()
);

create index contact_rate_limits_ip_created_idx
  on public.contact_rate_limits (ip_address, created_at desc);

alter table public.contact_rate_limits enable row level security;
-- No policies at all — nobody gets direct table access (not even via a
-- permissive default), only through the function below. This table has no
-- purpose being touched by anon or authenticated directly, ever.

create or replace function public.check_and_record_contact_rate_limit(
  p_ip_address text,
  p_window_seconds integer default 3600,
  p_max_attempts integer default 5
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if p_ip_address is null or length(trim(p_ip_address)) = 0 then
    -- Refuse to rate-limit against an empty key — that would silently
    -- pool every caller with no real IP into one bucket. Fail closed.
    return false;
  end if;

  -- Opportunistic cleanup — keeps this table bounded by the rate-limit
  -- window without needing a cron job, and limits how long raw IPs are
  -- retained (privacy-minimizing: nothing here outlives the window plus
  -- however long until the next call).
  delete from public.contact_rate_limits
  where created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into recent_count
  from public.contact_rate_limits
  where ip_address = p_ip_address
    and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if recent_count >= p_max_attempts then
    return false;
  end if;

  insert into public.contact_rate_limits (ip_address) values (p_ip_address);
  return true;
end;
$$;

grant execute on function
  public.check_and_record_contact_rate_limit(text, integer, integer)
  to anon, authenticated;

-- ─── 5. Facilitator contact-info lookup ─────────────────────────────────────
-- Takes a facilitator_profiles.id (the public identifier already used in
-- profile URLs — never the auth user_id) and returns contact info ONLY for
-- facilitators who are approved + public right now. Zero rows for a
-- pending/rejected/hidden/unlisted/nonexistent id — same shape for "id
-- doesn't exist" and "id exists but isn't public," so this can't be used to
-- probe which ids are real.

create or replace function public.get_facilitator_contact_info(
  p_facilitator_profile_id uuid
) returns table (
  facilitator_user_id uuid,
  facilitator_email text,
  facilitator_display_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select u.id, u.email, fp.display_name
  from public.facilitator_profiles fp
  join public.users u on u.id = fp.user_id
  where fp.id = p_facilitator_profile_id
    and fp.verification_status = 'approved'
    and fp.visibility = 'public';
$$;

grant execute on function
  public.get_facilitator_contact_info(uuid)
  to anon, authenticated;

comment on function public.get_facilitator_contact_info is
  'Server-side only. The Route Handler calls this to resolve who to email
   and what facilitator_id to store — its result must never be included in
   the JSON response sent back to the browser.';
