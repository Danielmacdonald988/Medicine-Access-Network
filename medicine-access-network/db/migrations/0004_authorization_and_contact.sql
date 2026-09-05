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
