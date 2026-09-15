-- Private, coarse engagement signals. No user IDs, form values or full URLs.
begin;
create table if not exists public.engagement_events (
  session_id uuid not null,
  event text not null check (event in ('visit','directory_view','profile_view','resource_view','search_used','search_empty','signup_view','signup_started','signup_accepted','signup_error','application_started','application_step','application_submitted','application_error','contact_started','contact_sent','contact_error','direct_contact','guide_saved')),
  step smallint not null default 0,
  source text not null check (source in ('direct','instagram','linktree','search','other')),
  device text not null check (device in ('mobile','tablet','desktop')),
  created_at timestamptz not null default now(),
  primary key (session_id,event,step),
  check ((event = 'application_step' and step between 1 and 14) or (event <> 'application_step' and step = 0))
);
create index if not exists engagement_events_created_idx on public.engagement_events(created_at);
alter table public.engagement_events enable row level security;
revoke all on public.engagement_events from public, anon, authenticated;
grant all on public.engagement_events to service_role;

create table if not exists public.engagement_limits (
  key text primary key,
  window_start timestamptz not null,
  requests integer not null
);
alter table public.engagement_limits enable row level security;
revoke all on public.engagement_limits from public, anon, authenticated;
grant all on public.engagement_limits to service_role;

create or replace function public.record_engagement(p_session uuid, p_event text, p_step integer, p_source text, p_device text, p_rate_key text)
returns void language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid_rate_key'; end if;
  insert into public.engagement_limits as limits(key,window_start,requests)
  values(p_rate_key, date_trunc('hour',now()), 1)
  on conflict(key) do update set
    requests = case when limits.window_start < date_trunc('hour',now()) then 1 else limits.requests + 1 end,
    window_start = date_trunc('hour',now())
  returning requests into n;
  if n > 600 then raise exception 'engagement_rate_limited'; end if;
  insert into public.engagement_events(session_id,event,step,source,device)
  values(p_session,p_event,p_step,p_source,p_device)
  on conflict do nothing;
  -- Bounded retention; expires on the next accepted event after the cutoff.
  delete from public.engagement_events where created_at < now() - interval '90 days';
  delete from public.engagement_limits where window_start < now() - interval '2 days';
end;
$$;
revoke all on function public.record_engagement(uuid,text,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.record_engagement(uuid,text,integer,text,text,text) to service_role;

create or replace function public.engagement_summary(p_days integer default 30)
returns jsonb language sql stable security definer set search_path = '' as $$
with selected as (
  select * from public.engagement_events
  where created_at >= now() - make_interval(days => case when p_days in (7,30,90) then p_days else 30 end)
), counts as (
  select event, count(distinct session_id) as total from selected group by event
), starts as (
  select session_id, event, created_at from selected where event in ('signup_started','application_started')
), outcomes as (
  select s.*, exists (
    select 1 from public.engagement_events e where e.session_id=s.session_id
    and e.event=case when s.event='signup_started' then 'signup_accepted' else 'application_submitted' end
    and e.created_at >= s.created_at and e.created_at <= s.created_at + interval '24 hours'
  ) as completed,
  coalesce((select max(e.step) from public.engagement_events e where e.session_id=s.session_id
    and e.event='application_step' and e.created_at >= s.created_at and e.created_at <= s.created_at + interval '24 hours'),1) as last_step
  from starts s
), funnels as (
  select event, jsonb_build_object(
    'started',count(*),
    'completed',count(*) filter(where completed),
    'pending',count(*) filter(where not completed and created_at > now()-interval '24 hours'),
    'dropped',count(*) filter(where not completed and created_at <= now()-interval '24 hours'),
    'matured',count(*) filter(where created_at <= now()-interval '24 hours'),
    'matured_completed',count(*) filter(where completed and created_at <= now()-interval '24 hours')
  ) as value from outcomes group by event
), last_steps as (
  select last_step, count(*) as total from outcomes
  where event='application_started' and not completed and created_at <= now()-interval '24 hours'
  group by last_step
), sources as (
  select source, count(*) as total from selected where event='visit' group by source
), devices as (
  select device, count(*) as total from selected where event='visit' group by device
)
select jsonb_build_object(
  'counts',coalesce((select jsonb_object_agg(event,total) from counts),'{}'::jsonb),
  'funnels',coalesce((select jsonb_object_agg(event,value) from funnels),'{}'::jsonb),
  'last_steps',coalesce((select jsonb_object_agg(last_step,total) from last_steps),'{}'::jsonb),
  'sources',coalesce((select jsonb_object_agg(source,total) from sources),'{}'::jsonb),
  'devices',coalesce((select jsonb_object_agg(device,total) from devices),'{}'::jsonb),
  'first_event',(select min(created_at) from public.engagement_events),
  'latest_event',(select max(created_at) from public.engagement_events),
  'generated_at',now()
);
$$;
revoke all on function public.engagement_summary(integer) from public, anon, authenticated;
grant execute on function public.engagement_summary(integer) to service_role;
notify pgrst, 'reload schema';
commit;
