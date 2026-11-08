-- Apply before deploying clients that emit the new coarse source categories.
-- No new identifiers, historical rewriting, permissions or retention changes.
begin;
alter table public.engagement_events
  drop constraint if exists engagement_events_source_check;
alter table public.engagement_events
  add constraint engagement_events_source_check
  check (source in ('direct','instagram','tiktok','x','youtube','chatgpt','linktree','search','other'));
commit;
