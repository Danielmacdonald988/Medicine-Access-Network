begin;
alter table public.facilitator_profiles
  add column if not exists instagram_url text check (instagram_url is null or (length(instagram_url) <= 500 and instagram_url ~ '^https://[^[:space:]]+$')),
  add column if not exists facebook_url text check (facebook_url is null or (length(facebook_url) <= 500 and facebook_url ~ '^https://[^[:space:]]+$')),
  add column if not exists linkedin_url text check (linkedin_url is null or (length(linkedin_url) <= 500 and linkedin_url ~ '^https://[^[:space:]]+$')),
  add column if not exists website_url text check (website_url is null or (length(website_url) <= 500 and website_url ~ '^https://[^[:space:]]+$'));
grant select (instagram_url, facebook_url, linkedin_url, website_url) on public.facilitator_profiles to anon;
create or replace view public.facilitator_public_profiles with (security_invoker = true) as
select id, display_name, bio, location, remote_available, modalities,
  years_experience, lineage_or_training, certifications, safety_practices,
  contraindications_acknowledged, donation_based, minimum_donation, hourly_rate,
  avatar_url, user_id, created_at, image_paths, whatsapp_url, signal_url, telegram_url,
  instagram_url, facebook_url, linkedin_url, website_url
from public.facilitator_profiles where public.is_facilitator_profile_public(id);
grant select on public.facilitator_public_profiles to anon, authenticated;
commit;
