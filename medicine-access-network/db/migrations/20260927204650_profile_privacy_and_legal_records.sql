begin;
-- Explicit publication boundary: a non-login, non-bypass role can read only
-- public listing columns. The view uses that role, never the postgres owner.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='tfn_public_profile_reader') then
    create role tfn_public_profile_reader nologin noinherit nobypassrls;
  end if;
end $$;
grant tfn_public_profile_reader to postgres;
grant usage on schema public to tfn_public_profile_reader;
grant select (id,display_name,location,remote_available,modalities,years_experience,
 donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,
 whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url,
 verification_status,visibility) on public.facilitator_profiles to tfn_public_profile_reader;
drop policy if exists "facilitator_profiles: anon reads approved+public" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: approved are public" on public.facilitator_profiles;
drop policy if exists "facilitator_profiles: publication reader" on public.facilitator_profiles;
create policy "facilitator_profiles: publication reader" on public.facilitator_profiles for select
 to tfn_public_profile_reader using (verification_status='approved' and visibility='public');
-- Revoke BOTH table and historical column grants. Authenticated owners/admins
-- keep base-table access, but no public-row policy can reveal another's record.
revoke all on public.facilitator_profiles from anon, public;
revoke truncate, references, trigger on public.facilitator_profiles from authenticated;
do $$ declare cols text; begin
 select string_agg(quote_ident(attname),',') into cols from pg_attribute
 where attrelid='public.facilitator_profiles'::regclass and attnum>0 and not attisdropped;
 execute 'revoke select ('||cols||') on public.facilitator_profiles from anon, public';
end $$;
-- Keep the old view's column shape temporarily for already-open clients. These
-- compatibility columns contain constants, never application narratives.
create or replace view public.facilitator_public_profiles
 with (security_invoker=false,security_barrier=true) as
select id,display_name,null::text as bio,location,remote_available,modalities,
 years_experience,null::text as lineage_or_training,null::text[] as certifications,
 null::text as safety_practices,false as contraindications_acknowledged,
 donation_based,minimum_donation,hourly_rate,avatar_url,user_id,created_at,image_paths,
 whatsapp_url,signal_url,telegram_url,instagram_url,facebook_url,linkedin_url,website_url
from public.facilitator_profiles where verification_status='approved' and visibility='public';
grant create on schema public to tfn_public_profile_reader;
alter view public.facilitator_public_profiles owner to tfn_public_profile_reader;
revoke create on schema public from tfn_public_profile_reader;
revoke all on public.facilitator_public_profiles from public,anon,authenticated;
grant select on public.facilitator_public_profiles to anon,authenticated,service_role;
comment on view public.facilitator_public_profiles is 'Public listing projection. Owner is a NOLOGIN NOBYPASSRLS role with only listing-column grants and approved/public row access. Narratives are constant NULL compatibility fields. Never restore public reads on the application table.';

alter table public.facilitator_profiles add column if not exists agreement_version text,
 add column if not exists agreement_accepted_at timestamptz;
create table if not exists public.provider_agreement_acceptances (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid references public.facilitator_profiles(id) on delete set null deferrable initially deferred,
 user_id uuid references public.users(id) on delete set null,
 agreement_version text not null,
 accepted_at timestamptz not null default now()
);
alter table public.provider_agreement_acceptances enable row level security;
revoke all on public.provider_agreement_acceptances from public,anon,authenticated;
grant select on public.provider_agreement_acceptances to authenticated;
grant all on public.provider_agreement_acceptances to service_role;
create policy "agreement records: owner or admin reads" on public.provider_agreement_acceptances
 for select to authenticated using (user_id=auth.uid() or public.get_my_role()='admin');
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create or replace function private.record_provider_agreement() returns trigger
 language plpgsql security definer set search_path='' as $$
begin
 if new.agreement_version is distinct from '2026-09-27.1' then
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
-- Existing records remain unaccepted. A supplied version must be current and
-- is timestamped by the database; acceptance is atomic with the profile write.
create trigger facilitator_agreement_on_insert before insert on public.facilitator_profiles
 for each row when (new.agreement_version is not null) execute function private.record_provider_agreement();
create trigger facilitator_agreement_on_update before update of agreement_version on public.facilitator_profiles
 for each row execute function private.record_provider_agreement();
-- The owner cannot rewrite the acceptance timestamp independently.
create or replace function private.protect_agreement_timestamp() returns trigger
 language plpgsql set search_path='' as $$
begin
 if new.agreement_accepted_at is distinct from old.agreement_accepted_at then
   raise exception 'agreement_timestamp_is_managed' using errcode='42501';
 end if;
 return new;
end $$;
create trigger facilitator_agreement_timestamp_guard before update of agreement_accepted_at on public.facilitator_profiles
 for each row execute function private.protect_agreement_timestamp();
revoke all on function private.protect_agreement_timestamp() from public,anon,authenticated;

create table if not exists public.profile_review_audit (
 id uuid primary key default gen_random_uuid(), profile_id uuid,
 admin_id uuid, status text not null, checklist_version text,
 note text, reviewed_at timestamptz not null default now()
);
alter table public.profile_review_audit enable row level security;
revoke all on public.profile_review_audit from public,anon,authenticated;
grant select,insert on public.profile_review_audit to authenticated;
grant all on public.profile_review_audit to service_role;
create policy "review audit: admin reads" on public.profile_review_audit for select to authenticated using (public.get_my_role()='admin');
create policy "review audit: admin records own decision" on public.profile_review_audit for insert to authenticated with check (public.get_my_role()='admin' and admin_id=auth.uid());
create or replace function public.review_facilitator_application(p_profile_id uuid,p_status text,p_note text,p_checklist_version text)
 returns void language plpgsql security invoker set search_path='' as $$
begin
 if public.get_my_role() is distinct from 'admin' then raise exception 'admin_required' using errcode='42501'; end if;
 if p_status not in ('approved','rejected','pending') or length(coalesce(p_note,''))>1000 then raise exception 'invalid_review' using errcode='23514'; end if;
 if p_status='approved' and p_checklist_version is distinct from '2026-09-27.1' then raise exception 'review_checklist_required' using errcode='23514'; end if;
 if p_status='approved' and not exists (select 1 from public.facilitator_profiles where id=p_profile_id and agreement_version='2026-09-27.1' and agreement_accepted_at is not null) then raise exception 'current_agreement_acceptance_required' using errcode='23514'; end if;
 update public.facilitator_profiles set verification_status=p_status::public.verification_status,
 visibility=case when p_status='approved' then 'public'::public.facilitator_visibility else 'hidden'::public.facilitator_visibility end
 where id=p_profile_id;
 if not found then raise exception 'profile_not_found' using errcode='P0002'; end if;
 insert into public.profile_review_audit(profile_id,admin_id,status,checklist_version,note)
 values(p_profile_id,auth.uid(),p_status,case when p_status='approved' then p_checklist_version end,p_note);
end $$;
revoke all on function public.review_facilitator_application(uuid,text,text,text) from public,anon;
grant execute on function public.review_facilitator_application(uuid,text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
