-- ============================================================================
-- The Facilitator Network — Database Schema
-- Run once in a fresh Supabase project via the SQL editor.
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
