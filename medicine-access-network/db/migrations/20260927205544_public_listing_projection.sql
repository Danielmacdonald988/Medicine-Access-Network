begin;
-- The public API has its own physical projection with no narrative columns.
-- An internal trigger updates/removes this row atomically with any profile edit.
create table public.facilitator_listing_data as select id,display_name,location,remote_available,modalities,years_experience,donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url from public.facilitator_profiles with no data;
alter table public.facilitator_listing_data add primary key(id);
alter table public.facilitator_listing_data enable row level security;
revoke all on public.facilitator_listing_data from public,anon,authenticated;
grant select on public.facilitator_listing_data to anon,authenticated;
grant all on public.facilitator_listing_data to service_role;
create policy "listing projection: public read" on public.facilitator_listing_data for select to anon,authenticated using (true);
create or replace function private.sync_public_listing() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and old.id is distinct from new.id then
  delete from public.facilitator_listing_data where id=old.id;
 end if;
 if tg_op='DELETE' then
  delete from public.facilitator_listing_data where id=old.id;
 elsif new.verification_status='approved' and new.visibility='public' then
  insert into public.facilitator_listing_data(id,display_name,location,remote_available,modalities,years_experience,donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url) values(new.id,new.display_name,new.location,new.remote_available,new.modalities,new.years_experience,new.donation_based,new.minimum_donation,new.hourly_rate,new.avatar_url,new.user_id,new.created_at,new.image_paths,new.whatsapp_url,new.signal_url,new.telegram_url,new.instagram_url,new.facebook_url,new.linkedin_url,new.website_url)
  on conflict(id) do update set display_name=excluded.display_name,location=excluded.location,remote_available=excluded.remote_available,modalities=excluded.modalities,years_experience=excluded.years_experience,donation_based=excluded.donation_based,minimum_donation=excluded.minimum_donation,hourly_rate=excluded.hourly_rate,avatar_url=excluded.avatar_url,user_id=excluded.user_id,created_at=excluded.created_at,image_paths=excluded.image_paths,whatsapp_url=excluded.whatsapp_url,signal_url=excluded.signal_url,telegram_url=excluded.telegram_url,instagram_url=excluded.instagram_url,facebook_url=excluded.facebook_url,linkedin_url=excluded.linkedin_url,website_url=excluded.website_url;
 else
  delete from public.facilitator_listing_data where id=new.id;
 end if;
 return null;
end $$;
revoke all on function private.sync_public_listing() from public,anon,authenticated;
create trigger facilitator_public_projection after insert or update or delete on public.facilitator_profiles
 for each row execute function private.sync_public_listing();
insert into public.facilitator_listing_data(id,display_name,location,remote_available,modalities,years_experience,donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url) select id,display_name,location,remote_available,modalities,years_experience,donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url from public.facilitator_profiles
 where verification_status='approved' and visibility='public';
alter view public.facilitator_public_profiles owner to postgres;
create or replace view public.facilitator_public_profiles with(security_invoker=true,security_barrier=true) as
select id,display_name,null::text as bio,location,remote_available,modalities,
 years_experience,null::text as lineage_or_training,null::text[] as certifications,
 null::text as safety_practices,false as contraindications_acknowledged,
 donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,
 whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url
from public.facilitator_listing_data;
comment on view public.facilitator_public_profiles is 'Invoker-rights view of public-only listing data. Narratives never enter its source table. Constant NULL compatibility columns retain old-client compatibility.';
drop policy "facilitator_profiles: publication reader" on public.facilitator_profiles;
revoke all on public.facilitator_profiles from tfn_public_profile_reader;
do $$ declare cols text; begin
 select string_agg(quote_ident(attname),',') into cols from pg_attribute
 where attrelid='public.facilitator_profiles'::regclass and attnum>0 and not attisdropped;
 execute 'revoke select ('||cols||') on public.facilitator_profiles from tfn_public_profile_reader';
end $$;
revoke usage on schema public from tfn_public_profile_reader;
revoke tfn_public_profile_reader from postgres;
notify pgrst,'reload schema';
commit;
