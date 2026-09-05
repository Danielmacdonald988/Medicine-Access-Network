-- ============================================================================
-- The Facilitator Network — Database Schema
-- Fresh Supabase projects only: this file includes migrations 0001–0004.
-- Existing projects: apply the numbered migrations instead; never rerun this file.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy text search

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type user_role          as enum ('seeker', 'facilitator', 'admin');
create type experience_level   as enum ('curious', 'beginner', 'experienced');
create type verification_status as enum ('pending', 'approved', 'rejected');
create type booking_status     as enum ('pending', 'accepted', 'declined', 'completed');
create type preferred_format   as enum ('voice', 'video', 'in_person', 'async');
create type privacy_preference as enum ('public', 'private');

-- ─── Shared updated_at trigger ───────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Shadow of auth.users — stores app-level role and display info.
-- NOTE: get_my_role() is defined AFTER this table so Supabase can validate the body.

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text        not null unique,
  full_name   text        not null default '',
  role        user_role   not null default 'seeker',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute procedure update_updated_at_column();

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
-- Reads full_name and role from auth.users.raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'seeker')::user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Role helper (security definer prevents RLS self-reference loops) ─────────
-- Defined here, after public.users exists, so Supabase can validate the function body.

create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role::text from public.users where id = auth.uid();
$$;

-- ─── Modalities ───────────────────────────────────────────────────────────────
-- Master list of practice types the platform supports.

create table public.modalities (
  id        uuid primary key default uuid_generate_v4(),
  name      text not null unique,
  category  text not null,
  sort_order integer not null default 0
);

-- ─── Seeker Profiles ─────────────────────────────────────────────────────────

create table public.seeker_profiles (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null unique references public.users(id) on delete cascade,
  display_name         text not null,
  location             text,
  remote_preference    boolean           not null default false,
  intention            text check (char_length(intention) <= 1000),
  experience_level     experience_level not null default 'curious',
  preferred_modalities text[]           not null default '{}',
  privacy_preference   privacy_preference not null default 'private',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Migration (if table already exists):
-- alter table public.seeker_profiles
--   add column if not exists remote_preference boolean not null default false,
--   alter column intention type text,
--   drop column if exists support_needs;

create trigger seeker_profiles_updated_at
  before update on public.seeker_profiles
  for each row execute procedure update_updated_at_column();

-- ─── Facilitator Profiles ────────────────────────────────────────────────────

create table public.facilitator_profiles (
  id                             uuid primary key default uuid_generate_v4(),
  user_id                        uuid not null unique references public.users(id) on delete cascade,
  display_name                   text not null,
  bio                            text not null check (char_length(bio) between 100 and 2000),
  location                       text,
  remote_available               boolean     not null default true,
  -- denormalized modality names for fast array queries; kept in sync via trigger
  modalities                     text[]      not null default '{}',
  years_experience               integer     check (years_experience between 0 and 50),
  lineage_or_training            text        check (char_length(lineage_or_training) <= 500),
  certifications                 text[],
  safety_practices               text        check (char_length(safety_practices) <= 1000),
  contraindications_acknowledged boolean     not null default false,
  donation_based                 boolean     not null default false,
  minimum_donation               numeric(10,2) check (minimum_donation >= 0),
  hourly_rate                    numeric(10,2) check (hourly_rate >= 0),
  avatar_url                     text,
  verification_status            verification_status not null default 'pending',
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);

create trigger facilitator_profiles_updated_at
  before update on public.facilitator_profiles
  for each row execute procedure update_updated_at_column();

-- Full-text search index on name + bio
create index facilitator_fts_idx on public.facilitator_profiles
  using gin(to_tsvector('english', display_name || ' ' || coalesce(bio, '')));

-- GIN index for array-contains queries
create index facilitator_modalities_arr_idx on public.facilitator_profiles using gin(modalities);

-- ─── Facilitator Modalities (normalised junction) ─────────────────────────────
-- Source of truth for modality assignments.  The text[] array above is a cache.

create table public.facilitator_modalities (
  id             uuid primary key default uuid_generate_v4(),
  facilitator_id uuid not null references public.facilitator_profiles(id) on delete cascade,
  modality_id    uuid not null references public.modalities(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (facilitator_id, modality_id)
);

create index facilitator_modalities_facilitator_idx on public.facilitator_modalities(facilitator_id);
create index facilitator_modalities_modality_idx    on public.facilitator_modalities(modality_id);

-- Keep the denormalised text[] in sync whenever the junction table changes.
create or replace function sync_modalities_array()
returns trigger language plpgsql security definer as $$
declare
  fid uuid := coalesce(new.facilitator_id, old.facilitator_id);
begin
  update public.facilitator_profiles
  set modalities = (
    select coalesce(array_agg(m.name order by m.name), '{}')
    from public.facilitator_modalities fm
    join public.modalities m on m.id = fm.modality_id
    where fm.facilitator_id = fid
  )
  where id = fid;
  return coalesce(new, old);
end;
$$;

create trigger sync_modalities_array_trigger
  after insert or update or delete on public.facilitator_modalities
  for each row execute procedure sync_modalities_array();

-- ─── Booking Requests ────────────────────────────────────────────────────────

create table public.booking_requests (
  id                       uuid primary key default uuid_generate_v4(),
  seeker_id                uuid not null references public.users(id) on delete cascade,
  facilitator_id           uuid not null references public.users(id) on delete cascade,
  requested_service        text not null,
  message                  text not null check (char_length(message) between 20 and 1000),
  preferred_format         preferred_format not null,
  preferred_time_window    text,
  status                   booking_status  not null default 'pending',
  -- Payment fields (inactive until NEXT_PUBLIC_PAYMENTS_ENABLED=true)
  payment_status           text not null default 'not_required'
                             check (payment_status in ('not_required', 'pending', 'paid', 'refunded', 'failed')),
  stripe_session_id        text,
  stripe_payment_intent_id text,
  created_at               timestamptz     not null default now(),
  updated_at               timestamptz     not null default now()
);

-- Migration (if table already exists):
-- alter table public.booking_requests
--   add column if not exists preferred_time_window text,
--   add column if not exists payment_status text not null default 'not_required'
--     check (payment_status in ('not_required', 'pending', 'paid', 'refunded', 'failed')),
--   add column if not exists stripe_session_id text,
--   add column if not exists stripe_payment_intent_id text;

create trigger booking_requests_updated_at
  before update on public.booking_requests
  for each row execute procedure update_updated_at_column();

create index booking_requests_seeker_idx        on public.booking_requests(seeker_id);
create index booking_requests_facilitator_idx   on public.booking_requests(facilitator_id);
create index booking_requests_status_idx        on public.booking_requests(status);
create index booking_requests_payment_status_idx on public.booking_requests(payment_status);

-- ─── Reviews ─────────────────────────────────────────────────────────────────

create table public.reviews (
  id                  uuid primary key default uuid_generate_v4(),
  booking_request_id  uuid not null unique references public.booking_requests(id) on delete cascade,
  seeker_id           uuid not null references public.users(id) on delete cascade,
  facilitator_id      uuid not null references public.users(id) on delete cascade,
  rating              integer not null check (rating between 1 and 5),
  text                text    not null check (char_length(text) between 20 and 1000),
  safety_rating       integer not null check (safety_rating between 1 and 5),
  integration_rating  integer not null check (integration_rating between 1 and 5),
  created_at          timestamptz not null default now()
);

-- Migration (if table already exists):
-- alter table public.reviews
--   add column if not exists booking_request_id uuid references public.booking_requests(id) on delete cascade,
--   drop constraint if exists reviews_seeker_id_facilitator_id_key;
-- update public.reviews r set booking_request_id = (
--   select br.id from public.booking_requests br
--   where br.seeker_id = r.seeker_id and br.facilitator_id = r.facilitator_id
--     and br.status = 'completed' limit 1
-- );
-- alter table public.reviews alter column booking_request_id set not null;
-- alter table public.reviews add constraint reviews_booking_request_id_key unique(booking_request_id);

create index reviews_facilitator_idx on public.reviews(facilitator_id);
create index reviews_seeker_idx      on public.reviews(seeker_id);

-- ─── Verification Notes ───────────────────────────────────────────────────────

create table public.verification_notes (
  id             uuid primary key default uuid_generate_v4(),
  facilitator_id uuid not null references public.users(id) on delete cascade,
  admin_id       uuid not null references public.users(id),
  status         verification_status not null,
  note           text check (char_length(note) <= 1000),
  created_at     timestamptz not null default now()
);

create index verification_notes_facilitator_idx on public.verification_notes(facilitator_id);

-- ─── Facilitator Subscriptions ────────────────────────────────────────────────
-- Placeholder table — inactive until NEXT_PUBLIC_PAYMENTS_ENABLED=true.
-- Tracks platform membership subscriptions for facilitators via Stripe.

create table public.facilitator_subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  facilitator_id          uuid not null unique references public.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text not null default 'inactive'
                            check (status in ('inactive', 'active', 'past_due', 'cancelled')),
  plan                    text not null default 'free',
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger facilitator_subscriptions_updated_at
  before update on public.facilitator_subscriptions
  for each row execute procedure update_updated_at_column();

create index facilitator_subscriptions_stripe_customer_idx
  on public.facilitator_subscriptions(stripe_customer_id);
create index facilitator_subscriptions_stripe_sub_idx
  on public.facilitator_subscriptions(stripe_subscription_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.users                      enable row level security;
alter table public.seeker_profiles            enable row level security;
alter table public.facilitator_profiles       enable row level security;
alter table public.facilitator_modalities     enable row level security;
alter table public.booking_requests           enable row level security;
alter table public.reviews                    enable row level security;
alter table public.verification_notes         enable row level security;
alter table public.modalities                 enable row level security;
alter table public.facilitator_subscriptions  enable row level security;

-- ── users ────────────────────────────────────────────────────────────────────

create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: admins read all"
  on public.users for select
  using (get_my_role() = 'admin');

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- Needed so handle_new_user() trigger can insert; the function is security definer
-- so it bypasses RLS, but we add this for direct inserts in migrations/seeds.
create policy "users: service role insert"
  on public.users for insert
  with check (true);

-- ── modalities ────────────────────────────────────────────────────────────────

create policy "modalities: public read"
  on public.modalities for select
  using (true);

create policy "modalities: admin write"
  on public.modalities for all
  using (get_my_role() = 'admin');

-- ── seeker_profiles ───────────────────────────────────────────────────────────

create policy "seeker_profiles: own row full access"
  on public.seeker_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "seeker_profiles: admins read all"
  on public.seeker_profiles for select
  using (get_my_role() = 'admin');

-- ── facilitator_profiles ──────────────────────────────────────────────────────

create policy "facilitator_profiles: approved are public"
  on public.facilitator_profiles for select
  using (verification_status = 'approved');

create policy "facilitator_profiles: own row full access"
  on public.facilitator_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "facilitator_profiles: admins full access"
  on public.facilitator_profiles for all
  using (get_my_role() = 'admin');

-- ── facilitator_modalities ────────────────────────────────────────────────────

create policy "facilitator_modalities: public read"
  on public.facilitator_modalities for select
  using (
    exists (
      select 1 from public.facilitator_profiles fp
      where fp.id = facilitator_id
        and fp.verification_status = 'approved'
    )
  );

create policy "facilitator_modalities: own profile write"
  on public.facilitator_modalities for all
  using (
    exists (
      select 1 from public.facilitator_profiles fp
      where fp.id = facilitator_id
        and fp.user_id = auth.uid()
    )
  );

create policy "facilitator_modalities: admins full access"
  on public.facilitator_modalities for all
  using (get_my_role() = 'admin');

-- ── booking_requests ──────────────────────────────────────────────────────────

create policy "booking_requests: parties can read"
  on public.booking_requests for select
  using (auth.uid() = seeker_id or auth.uid() = facilitator_id);

create policy "booking_requests: seekers create"
  on public.booking_requests for insert
  with check (
    auth.uid() = seeker_id
    and get_my_role() = 'seeker'
  );

create policy "booking_requests: facilitators update status"
  on public.booking_requests for update
  using (auth.uid() = facilitator_id)
  with check (auth.uid() = facilitator_id);

create policy "booking_requests: admins read all"
  on public.booking_requests for select
  using (get_my_role() = 'admin');

-- ── reviews ───────────────────────────────────────────────────────────────────

create policy "reviews: public read"
  on public.reviews for select
  using (true);

-- Only allow insert when the booking_request is completed and belongs to this seeker.
-- Prevents anonymous or unlinked reviews.
create policy "reviews: seekers insert for completed requests"
  on public.reviews for insert
  with check (
    auth.uid() = seeker_id
    and exists (
      select 1 from public.booking_requests br
      where br.id = booking_request_id
        and br.seeker_id = auth.uid()
        and br.status = 'completed'
    )
  );

-- ── verification_notes ────────────────────────────────────────────────────────

create policy "verification_notes: admin only"
  on public.verification_notes for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ── facilitator_subscriptions ─────────────────────────────────────────────────

create policy "facilitator_subscriptions: own row read"
  on public.facilitator_subscriptions for select
  using (auth.uid() = facilitator_id);

create policy "facilitator_subscriptions: admins full access"
  on public.facilitator_subscriptions for all
  using (get_my_role() = 'admin');

-- ─── Realtime ────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.booking_requests;


-- Included migration: 0001_facilitator_status_visibility.sql
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


-- Included migration: 0002_facilitator_public_rls.sql
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


-- Included migration: 0003_contact_without_account.sql
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


-- Included migration: 0004_authorization_and_contact.sql
-- Migration 0004: authorization and server-only anonymous contact.
-- Requires 0001, 0002 and 0003. Safe to reapply.
-- Apply through a trusted Supabase SQL/admin connection after reviewing this file.
-- This migration does not change existing roles or approval decisions.
-- Bootstrap an administrator only through a trusted SQL/service_role connection:
--   update public.users set role = 'admin' where id = '<confirmed user UUID>';
-- Never accept an admin role from auth user metadata.

begin;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'facilitator'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.get_my_role()
returns text language sql security definer stable set search_path = '' as $$
  select role::text from public.users where id = auth.uid();
$$;

-- An authenticated caller may recover only their own non-admin profile.
-- Service-role connections already bypass RLS; an unrestricted insert policy is
-- neither necessary for the auth trigger nor safe for public API callers.
drop policy if exists "users: service role insert" on public.users;
drop policy if exists "users: self-heal insert own row" on public.users;
drop policy if exists "users: insert own non-admin row" on public.users;
create policy "users: insert own non-admin row"
  on public.users for insert to authenticated
  with check (auth.uid() = id and role = 'facilitator');

drop policy if exists "users: update own row" on public.users;
create policy "users: update own row"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS decides which rows; column grants decide which fields callers can change.
-- Do not restore a table-wide authenticated UPDATE grant on these tables.
revoke insert, update on public.users from public, anon, authenticated;
grant insert (id, email, full_name, role) on public.users to authenticated;
grant update (full_name) on public.users to authenticated;

-- Owners can read their application and submit changes for another review.
-- Only the existing admin policy (or service_role) permits approval/rejection.
drop policy if exists "facilitator_profiles: own row full access" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: owners read" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: owners submit pending" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: owners resubmit pending" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: owners delete" on public.facilitator_profiles;
create policy "facilitator_profiles: owners read"
  on public.facilitator_profiles for select to authenticated
  using (auth.uid() = user_id);
create policy "facilitator_profiles: owners submit pending"
  on public.facilitator_profiles for insert to authenticated
  with check (
    auth.uid() = user_id and public.get_my_role() = 'facilitator'
    and verification_status = 'pending' and visibility = 'hidden'
  );
create policy "facilitator_profiles: owners resubmit pending"
  on public.facilitator_profiles for update to authenticated
  using (auth.uid() = user_id and public.get_my_role() = 'facilitator')
  with check (
    auth.uid() = user_id and public.get_my_role() = 'facilitator'
    and verification_status = 'pending' and visibility = 'hidden'
  );
create policy "facilitator_profiles: owners delete"
  on public.facilitator_profiles for delete to authenticated
  using (auth.uid() = user_id and public.get_my_role() = 'facilitator');

-- Junction-table changes must obey the same profile review boundary. A SECURITY
-- DEFINER trigger would otherwise let owners edit an approved profile indirectly.
create or replace function public.sync_modalities_array()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  fid uuid := coalesce(new.facilitator_id, old.facilitator_id);
begin
  update public.facilitator_profiles
  set modalities = (
    select coalesce(array_agg(m.name order by m.name), '{}')
    from public.facilitator_modalities fm
    join public.modalities m on m.id = fm.modality_id
    where fm.facilitator_id = fid
  )
  where id = fid;
  return coalesce(new, old);
end;
$$;

-- Contact submissions go through the server-only atomic RPC below. Direct
-- browser writes would bypass its rate limit and expose an unprotected inbox.
drop policy if exists "booking_requests: seekers create" on public.booking_requests;
drop policy if exists "booking_requests: anonymous contact submissions" on public.booking_requests;
revoke insert on public.booking_requests from public, anon, authenticated;
-- REVOKE at table level does not remove the column grants installed by 0003.
revoke insert (facilitator_id, requested_service, message, preferred_format,
  preferred_time_window, seeker_name, seeker_email)
  on public.booking_requests from public, anon, authenticated;

drop policy if exists "booking_requests: facilitators update status" on public.booking_requests;
create policy "booking_requests: facilitators update status"
  on public.booking_requests for update to authenticated
  using (auth.uid() = facilitator_id and public.get_my_role() = 'facilitator')
  with check (
    auth.uid() = facilitator_id and public.get_my_role() = 'facilitator'
    and status in ('accepted', 'declined', 'completed')
  );
revoke update on public.booking_requests from public, anon, authenticated;
grant update (status) on public.booking_requests to authenticated;

-- A completed request cannot be reused to publish a review of a different guide.
drop policy if exists "reviews: seekers insert for completed requests" on public.reviews;
create policy "reviews: seekers insert for completed requests"
  on public.reviews for insert to authenticated
  with check (
    auth.uid() = seeker_id and public.get_my_role() = 'seeker'
    and exists (
      select 1 from public.booking_requests br
      where br.id = reviews.booking_request_id
        and br.seeker_id = auth.uid()
        and br.facilitator_id = reviews.facilitator_id
        and br.status = 'completed'
    )
  );

-- Function grants are additive: revoke PUBLIC, not just the explicit anon grant.
revoke all on function public.get_facilitator_contact_info(uuid) from public, anon, authenticated;
grant execute on function public.get_facilitator_contact_info(uuid) to service_role;
revoke all on public.contact_rate_limits from public, anon, authenticated;
comment on column public.contact_rate_limits.ip_address is
  'Opaque HMAC rate-limit key supplied by the trusted server; never a raw IP.';
-- Remove legacy raw IP records when switching storage format.
delete from public.contact_rate_limits where ip_address !~ '^[a-f0-9]{64}$';

create or replace function public.check_and_record_contact_rate_limit(
  p_ip_address text,
  p_window_seconds integer default 3600,
  p_max_attempts integer default 5
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  recent_count integer;
begin
  if p_ip_address is null or p_ip_address !~ '^[a-f0-9]{64}$'
    or p_window_seconds is distinct from 3600 or p_max_attempts is distinct from 5 then
    return false;
  end if;
  -- Serialize attempts for one key; count+insert must not race.
  perform pg_advisory_xact_lock(hashtextextended(p_ip_address, 0));
  delete from public.contact_rate_limits where created_at < now() - interval '1 hour';
  select count(*) into recent_count from public.contact_rate_limits
    where ip_address = p_ip_address and created_at > now() - interval '1 hour';
  if recent_count >= 5 then return false; end if;
  insert into public.contact_rate_limits (ip_address) values (p_ip_address);
  return true;
end;
$$;
revoke all on function public.check_and_record_contact_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_and_record_contact_rate_limit(text, integer, integer)
  to service_role;

create or replace function public.submit_contact_request(
  p_facilitator_profile_id uuid,
  p_rate_limit_key text,
  p_seeker_name text,
  p_seeker_email text,
  p_requested_service text,
  p_message text,
  p_preferred_format public.preferred_format,
  p_preferred_time_window text default null
) returns table (
  request_id uuid,
  facilitator_email text,
  facilitator_display_name text
)
language plpgsql security definer set search_path = '' as $$
declare
  contact record;
  new_request_id uuid;
begin
  if p_seeker_name is null or char_length(trim(p_seeker_name)) not between 2 and 200
    or p_seeker_email is null or char_length(p_seeker_email) > 254
    or p_seeker_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or p_requested_service is null or char_length(trim(p_requested_service)) not between 1 and 200
    or p_message is null or char_length(p_message) not between 20 and 1000
    or p_preferred_format is null or char_length(p_preferred_time_window) > 200 then
    raise exception using errcode = '22023', message = 'invalid_contact_request';
  end if;

  -- Hold the profile row so it cannot become hidden during the insert.
  select u.id as user_id, u.email, fp.display_name into contact
  from public.facilitator_profiles fp join public.users u on u.id = fp.user_id
  where fp.id = p_facilitator_profile_id
    and fp.verification_status = 'approved' and fp.visibility = 'public'
  for share of fp;
  if not found then return; end if;

  if not public.check_and_record_contact_rate_limit(p_rate_limit_key) then
    raise exception using errcode = 'P0001', message = 'contact_rate_limited';
  end if;

  insert into public.booking_requests (
    facilitator_id, seeker_name, seeker_email, requested_service, message,
    preferred_format, preferred_time_window, status
  ) values (
    contact.user_id, trim(p_seeker_name), p_seeker_email, p_requested_service,
    p_message, p_preferred_format, p_preferred_time_window, 'pending'
  ) returning id into new_request_id;

  return query select new_request_id, contact.email::text, contact.display_name::text;
end;
$$;
revoke all on function public.submit_contact_request(uuid, text, text, text, text, text, public.preferred_format, text)
  from public, anon, authenticated;
grant execute on function public.submit_contact_request(uuid, text, text, text, text, text, public.preferred_format, text)
  to service_role;

commit;
