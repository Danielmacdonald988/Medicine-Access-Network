-- Production data fix, applied 2026-11-11 after
-- 20261111-withhold-bio-pending-revision.sql.
-- The operator reviewed the withheld bio and chose to publish it as written.
update public.facilitator_profiles set bio_withheld=false
where id='c63abae5-0885-4da3-a6ce-3aa2a3b755b2';
