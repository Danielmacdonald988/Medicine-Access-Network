-- Private source-specific contact signals; no new collection or inquiry joins.
begin;
create or replace function public.engagement_summary(p_days integer default 30)
returns jsonb language sql stable security definer set search_path = '' as $$
with selected as (
  select * from public.engagement_events
  where created_at >= now() - make_interval(days => case when p_days in (7,30,90) then p_days else 30 end)
), counts as (
  select event, count(distinct session_id) as total from selected group by event
), starts as (
  select session_id, event, created_at, source from selected where event in ('signup_started','application_started','contact_started')
), outcomes as (
  select s.*, exists (
    select 1 from public.engagement_events e where e.session_id=s.session_id
    and e.event=case s.event when 'signup_started' then 'signup_accepted' when 'contact_started' then 'contact_sent' else 'application_submitted' end
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
), source_contact_outcomes as (
  -- Existing coarse rows only. Inconsistent source sessions are not attributed.
  select o.*, (select count(distinct e.source) = 1
    from public.engagement_events e where e.session_id=o.session_id) as consistent_source
  from outcomes o where o.event='contact_started'
), source_contact_funnels as (
  select source, jsonb_build_object(
    'started',count(*),
    'completed',count(*) filter(where completed),
    'pending',count(*) filter(where not completed and created_at > now()-interval '24 hours'),
    'dropped',count(*) filter(where not completed and created_at <= now()-interval '24 hours'),
    'matured',count(*) filter(where created_at <= now()-interval '24 hours'),
    'matured_completed',count(*) filter(where completed and created_at <= now()-interval '24 hours')
  ) as value from source_contact_outcomes where consistent_source group by source
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
  'source_contact_funnels',coalesce((select jsonb_object_agg(source,value) from source_contact_funnels),'{}'::jsonb),
  'excluded_source_sessions',(select count(*) from source_contact_outcomes where not consistent_source),
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
