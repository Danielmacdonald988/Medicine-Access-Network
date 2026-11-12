-- Production data fix, applied together with
-- migrations/20261111213000_publish_existing_bios.sql on 2026-11-11.
-- Run BEFORE that migration's backfill so this bio is never published.
--
-- Withheld: the bio describes facilitating Bufo and mushroom journeys, which
-- conflicts with the platform rule against language about administering or
-- arranging access to controlled substances. The listing itself stays public.
-- Release with: update public.facilitator_profiles set bio_withheld=false where id='c63abae5-0885-4da3-a6ce-3aa2a3b755b2';
update public.facilitator_profiles set bio_withheld=true
where id='c63abae5-0885-4da3-a6ce-3aa2a3b755b2';
