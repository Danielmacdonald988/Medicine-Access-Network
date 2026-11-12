-- Public bio, opt-in by agreement version.
--
-- Agreement 2026-09-27.1 told guides their bio is restricted application
-- information. Agreement 2026-11-11.1 says the bio is published on an
-- approved listing. A bio therefore enters the public projection only for a
-- profile whose recorded acceptance is 2026-11-11.1. Profiles that last
-- accepted 2026-09-27.1 keep a NULL public bio until the guide resubmits and
-- an administrator approves again. Training descriptions, certifications and
-- safety narratives stay restricted for every version.
--
-- Safe to apply before the matching application release: the earlier
-- agreement version remains acceptable to the database, and the public view
-- keeps the same columns.
begin;

alter table public.facilitator_listing_data add column if not exists bio text;

-- Acceptance: either published version may be recorded. The application
-- submits only the current one; the earlier one is kept so an older client
-- cannot fail between this migration and the release.
create or replace function private.record_provider_agreement() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if new.agreement_version is null or new.agreement_version not in ('2026-09-27.1','2026-11-11.1') then
   raise exception 'current_provider_agreement_required' using errcode='23514';
 end if;
 if auth.uid() is distinct from new.user_id then
   raise exception 'only_owner_can_accept_agreement' using errcode='42501';
 end if;
 new.agreement_accepted_at := clock_timestamp();
 insert into public.provider_agreement_acceptances(profile_id,user_id,agreement_version,accepted_at)
 values (new.id,new.user_id,new.agreement_version,new.agreement_accepted_at);
 return new;
end $$;
revoke all on function private.record_provider_agreement() from public,anon,authenticated;

-- Approval: unchanged except that either published agreement version counts.
-- The review checklist version is separate and stays 2026-09-27.1.
create or replace function public.review_facilitator_application(p_profile_id uuid,p_status text,p_note text,p_checklist_version text)
 returns void language plpgsql security invoker set search_path='' as $$
begin
 if public.get_my_role() is distinct from 'admin' then raise exception 'admin_required' using errcode='42501'; end if;
 if p_status not in ('approved','rejected','pending') or length(coalesce(p_note,''))>1000 then raise exception 'invalid_review' using errcode='23514'; end if;
 if p_status='approved' and p_checklist_version is distinct from '2026-09-27.1' then raise exception 'review_checklist_required' using errcode='23514'; end if;
 if p_status='approved' and not exists (select 1 from public.facilitator_profiles where id=p_profile_id and agreement_version in ('2026-09-27.1','2026-11-11.1') and agreement_accepted_at is not null) then raise exception 'current_agreement_acceptance_required' using errcode='23514'; end if;
 update public.facilitator_profiles set verification_status=p_status::public.verification_status,
 visibility=case when p_status='approved' then 'public'::public.facilitator_visibility else 'hidden'::public.facilitator_visibility end
 where id=p_profile_id;
 if not found then raise exception 'profile_not_found' using errcode='P0002'; end if;
 insert into public.profile_review_audit(profile_id,admin_id,status,checklist_version,note)
 values(p_profile_id,auth.uid(),p_status,case when p_status='approved' then p_checklist_version end,p_note);
end $$;
revoke all on function public.review_facilitator_application(uuid,text,text,text) from public,anon;
grant execute on function public.review_facilitator_application(uuid,text,text,text) to authenticated;

-- Projection: copy the bio only under the agreement that authorizes it.
create or replace function private.sync_public_listing() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and old.id is distinct from new.id then
  delete from public.facilitator_listing_data where id=old.id;
 end if;
 if tg_op='DELETE' then
  delete from public.facilitator_listing_data where id=old.id;
 elsif new.verification_status='approved' and new.visibility='public' then
  insert into public.facilitator_listing_data(id,display_name,location,remote_available,modalities,years_experience,donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url,bio) values(new.id,new.display_name,new.location,new.remote_available,new.modalities,new.years_experience,new.donation_based,new.minimum_donation,new.hourly_rate,new.avatar_url,new.user_id,new.created_at,new.image_paths,new.whatsapp_url,new.signal_url,new.telegram_url,new.instagram_url,new.facebook_url,new.linkedin_url,new.website_url,
   case when new.agreement_version='2026-11-11.1' and new.agreement_accepted_at is not null then new.bio end)
  on conflict(id) do update set display_name=excluded.display_name,location=excluded.location,remote_available=excluded.remote_available,modalities=excluded.modalities,years_experience=excluded.years_experience,donation_based=excluded.donation_based,minimum_donation=excluded.minimum_donation,hourly_rate=excluded.hourly_rate,avatar_url=excluded.avatar_url,user_id=excluded.user_id,created_at=excluded.created_at,image_paths=excluded.image_paths,whatsapp_url=excluded.whatsapp_url,signal_url=excluded.signal_url,telegram_url=excluded.telegram_url,instagram_url=excluded.instagram_url,facebook_url=excluded.facebook_url,linkedin_url=excluded.linkedin_url,website_url=excluded.website_url,bio=excluded.bio;
 else
  delete from public.facilitator_listing_data where id=new.id;
 end if;
 return null;
end $$;
revoke all on function private.sync_public_listing() from public,anon,authenticated;

-- Existing rows: nobody has accepted 2026-11-11.1 yet, so this publishes
-- nothing today. It keeps the migration correct if it is ever re-applied.
update public.facilitator_listing_data l set bio=p.bio
from public.facilitator_profiles p
where p.id=l.id and p.verification_status='approved' and p.visibility='public'
 and p.agreement_version='2026-11-11.1' and p.agreement_accepted_at is not null;

create or replace view public.facilitator_public_profiles with(security_invoker=true,security_barrier=true) as
select id,display_name,bio,location,remote_available,modalities,
 years_experience,null::text as lineage_or_training,null::text[] as certifications,
 null::text as safety_practices,false as contraindications_acknowledged,
 donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,
 whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url
from public.facilitator_listing_data;
comment on view public.facilitator_public_profiles is 'Invoker-rights view of public-only listing data. The bio is present only for profiles whose recorded agreement is 2026-11-11.1; training, certification and safety narratives never enter its source table and remain constant NULL compatibility columns.';
notify pgrst,'reload schema';
commit;
