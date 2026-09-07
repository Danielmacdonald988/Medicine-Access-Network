-- Migration 0006: private, durable application-review notifications.
-- Requires 0001–0005. Safe to reapply. No email addresses or application text
-- are stored here; the trusted server resolves its configured administrator.
begin;

-- This account-level budget deliberately has no profile foreign key. Deleting
-- and recreating an application must not reset notification limits or leases.
create table if not exists public.admin_application_notification_limits (
  user_id uuid primary key references public.users(id) on delete cascade,
  next_attempt_at timestamptz not null default now(),
  last_sent_at timestamptz,
  claim_event_id uuid,
  claim_token uuid,
  lease_expires_at timestamptz,
  attempts integer not null default 0 check (attempts between 0 and 8),
  window_attempts integer not null default 0 check (window_attempts between 0 and 8),
  attempt_window_started_at timestamptz not null default now(),
  check ((claim_event_id is null) = (claim_token is null)
    and (claim_token is null) = (lease_expires_at is null))
);
alter table public.admin_application_notification_limits enable row level security;
revoke all on public.admin_application_notification_limits from public, anon, authenticated;
grant all on public.admin_application_notification_limits to service_role;

create table if not exists public.admin_application_notifications (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  profile_id uuid not null unique references public.facilitator_profiles(id) on delete cascade,
  pending boolean not null default true,
  requested_at timestamptz not null default now(),
  next_attempt_at timestamptz not null default now(),
  last_sent_at timestamptz,
  claim_token uuid,
  lease_expires_at timestamptz,
  attempts integer not null default 0 check (attempts between 0 and 8),
  window_attempts integer not null default 0 check (window_attempts between 0 and 8),
  attempt_window_started_at timestamptz not null default now(),
  check ((claim_token is null) = (lease_expires_at is null))
);
alter table public.admin_application_notifications enable row level security;
revoke all on public.admin_application_notifications from public, anon, authenticated;
grant all on public.admin_application_notifications to service_role;
create index if not exists admin_application_notifications_due_idx
  on public.admin_application_notifications(next_attempt_at) where pending;

create or replace function public.enqueue_admin_application_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.verification_status <> 'pending' or new.visibility <> 'hidden' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    -- Authenticated owners resubmit their own application. Admin moderation,
    -- maintenance writes and timestamp-only saves must not generate mail.
    if auth.uid() is distinct from new.user_id
      or public.get_my_role() is distinct from 'facilitator'
      or (to_jsonb(new) - array['created_at', 'updated_at'])
         is not distinct from (to_jsonb(old) - array['created_at', 'updated_at']) then
      return new;
    end if;
  end if;

  insert into public.admin_application_notification_limits(user_id)
  values (new.user_id) on conflict (user_id) do nothing;
  insert into public.admin_application_notifications as existing (profile_id, next_attempt_at, last_sent_at)
  select new.id, budget.next_attempt_at, budget.last_sent_at
  from public.admin_application_notification_limits budget where budget.user_id = new.user_id
  on conflict (profile_id) do update set
    -- All unsent edits share one event, including edits during a claim lease.
    -- A new event gets a new provider idempotency key only after delivery.
    id = case when existing.pending then existing.id else pg_catalog.gen_random_uuid() end,
    pending = true,
    requested_at = now(),
    next_attempt_at = case when existing.pending then existing.next_attempt_at
      else greatest(now(), existing.last_sent_at + interval '15 minutes') end,
    attempts = case when existing.pending then existing.attempts else 0 end,
    window_attempts = case when existing.pending then existing.window_attempts else 0 end,
    attempt_window_started_at = case when existing.pending then existing.attempt_window_started_at else now() end;
  return new;
end;
$$;
revoke all on function public.enqueue_admin_application_notification() from public, anon, authenticated;

drop trigger if exists facilitator_application_notification on public.facilitator_profiles;
create trigger facilitator_application_notification
  after insert or update on public.facilitator_profiles
  for each row execute function public.enqueue_admin_application_notification();

-- Include applications already waiting when this migration is first installed.
-- Reapplying does not reset delivered events, claim leases or retry state.
insert into public.admin_application_notification_limits(user_id)
select user_id from public.facilitator_profiles
where verification_status = 'pending' and visibility = 'hidden'
on conflict (user_id) do nothing;
insert into public.admin_application_notifications(profile_id, next_attempt_at, last_sent_at)
select profile.id, budget.next_attempt_at, budget.last_sent_at
from public.facilitator_profiles profile
join public.admin_application_notification_limits budget on budget.user_id = profile.user_id
where profile.verification_status = 'pending' and profile.visibility = 'hidden'
on conflict (profile_id) do nothing;

create or replace function public.claim_admin_application_notifications(
  p_limit integer default 5,
  p_profile_id uuid default null
) returns table (id uuid, profile_id uuid, claim_token uuid)
language plpgsql security definer set search_path = '' as $$
begin
  if p_limit is null or p_limit not between 1 and 20 then
    raise exception using errcode = '22023', message = 'invalid_notification_limit';
  end if;

  return query
  with due as (
    select notification.id, budget.user_id
    from public.admin_application_notifications notification
    join public.facilitator_profiles profile on profile.id = notification.profile_id
    join public.admin_application_notification_limits budget on budget.user_id = profile.user_id
    where notification.pending
      and notification.next_attempt_at <= now()
      and (notification.lease_expires_at is null or notification.lease_expires_at <= now())
      and budget.next_attempt_at <= now()
      and (budget.lease_expires_at is null or budget.lease_expires_at <= now())
      and (budget.window_attempts < 8
        or budget.attempt_window_started_at <= now() - interval '1 hour')
      and (p_profile_id is null or notification.profile_id = p_profile_id)
      and profile.verification_status = 'pending' and profile.visibility = 'hidden'
    order by notification.next_attempt_at, notification.id
    limit p_limit
    for update of notification, budget skip locked
  ), claimed_budgets as (
    update public.admin_application_notification_limits budget
    set claim_event_id = due.id,
        claim_token = pg_catalog.gen_random_uuid(),
        lease_expires_at = now() + interval '2 minutes',
        attempts = least(budget.attempts + 1, 8),
        window_attempts = case
          when budget.attempt_window_started_at <= now() - interval '1 hour' then 1
          else budget.window_attempts + 1 end,
        attempt_window_started_at = case
          when budget.attempt_window_started_at <= now() - interval '1 hour' then now()
          else budget.attempt_window_started_at end
    from due where budget.user_id = due.user_id
    returning budget.*
  )
  update public.admin_application_notifications notification
  set claim_token = budget.claim_token,
      lease_expires_at = budget.lease_expires_at,
      attempts = budget.attempts,
      window_attempts = budget.window_attempts,
      attempt_window_started_at = budget.attempt_window_started_at
  from claimed_budgets budget
  where notification.id = budget.claim_event_id
  returning notification.id, notification.profile_id, notification.claim_token;
end;
$$;
revoke all on function public.claim_admin_application_notifications(integer, uuid) from public, anon, authenticated;
grant execute on function public.claim_admin_application_notifications(integer, uuid) to service_role;

create or replace function public.finish_admin_application_notification(
  p_id uuid,
  p_claim_token uuid,
  p_sent boolean
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  finished_budget record;
begin
  if p_id is null or p_claim_token is null or p_sent is null then return false; end if;
  -- Match the claim lock order: event first, then account budget. The event may
  -- already be gone if its owner deleted the profile during network delivery.
  perform 1 from public.admin_application_notifications notification
  where notification.id = p_id and notification.claim_token = p_claim_token
  for update;
  update public.admin_application_notification_limits budget
  set last_sent_at = case when p_sent then now() else budget.last_sent_at end,
      next_attempt_at = case when p_sent then now() + interval '15 minutes'
        else greatest(
          now() + make_interval(secs => least(60 * power(2, greatest(budget.attempts - 1, 0)), 3600)::integer),
          coalesce(budget.last_sent_at + interval '15 minutes', now())
        ) end,
      attempts = case when p_sent then 0 else budget.attempts end,
      claim_event_id = null,
      claim_token = null,
      lease_expires_at = null
  where budget.claim_event_id = p_id and budget.claim_token = p_claim_token
  returning budget.* into finished_budget;
  if not found then return false; end if;

  update public.admin_application_notifications notification
  set pending = not p_sent,
      last_sent_at = finished_budget.last_sent_at,
      next_attempt_at = finished_budget.next_attempt_at,
      claim_token = null,
      lease_expires_at = null
  where notification.id = p_id and notification.claim_token = p_claim_token
    and notification.pending
  ;
  -- A late worker may finish an expired lease only while its token still owns
  -- the event. Once another worker claims it, the old token is harmless.
  return true;
end;
$$;
revoke all on function public.finish_admin_application_notification(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.finish_admin_application_notification(uuid, uuid, boolean) to service_role;

comment on table public.admin_application_notifications is
  'Private coalescing outbox for application-review emails. Server dispatch only; '
  'failed events remain pending, with bounded claims/backoff and a 15-minute send cooldown.';
comment on table public.admin_application_notification_limits is
  'Private per-account dispatch budget and lease. Survives profile deletion so '
  'delete/recreate cannot bypass notification limits; removed when the account is deleted.';
commit;
