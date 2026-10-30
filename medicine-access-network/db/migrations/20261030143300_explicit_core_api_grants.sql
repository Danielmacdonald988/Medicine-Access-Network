-- Explicit Data API access for fresh/recreated databases without automatic
-- public-table grants. Existing tables retain their grants under Supabase's
-- October 30, 2026 change; this is not an emergency production repair.
-- Apply after the profile social-links and privacy/listing migrations.
-- Additive and safe to reapply. Does not change default privileges, policies
-- or data, or revoke existing grants. Do not replace these with GRANT ALL.

begin;

-- Refuse to expose core tables if required tables are missing or RLS is disabled.
do $$
begin
  if (
    select count(*) from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('users', 'facilitator_profiles', 'booking_requests', 'reviews')
      and c.relkind = 'r' and c.relrowsecurity
  ) <> 4 then
    raise exception using errcode = '42501', message = 'core_api_grants_require_rls';
  end if;
end;
$$;

-- Session lookup and owner/admin application flows. Existing RLS still decides
-- which rows can be read, submitted, resubmitted, removed, or reviewed.
grant select on public.users to authenticated;
grant select, insert, update, delete on public.facilitator_profiles to authenticated;

-- Inbox reads and public/legacy reviews. Keep users INSERT/UPDATE and request
-- UPDATE column-scoped as installed by 0004; never restore direct request INSERT.
grant select on public.booking_requests to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

-- Trusted server media lookups and fixed-field contact edits. No new general
-- service-role write access or public access to private application narratives.
grant select on public.facilitator_profiles to service_role;
grant update (whatsapp_url, signal_url, telegram_url, instagram_url,
  facebook_url, linkedin_url, website_url) on public.facilitator_profiles to service_role;

-- Preserve the documented trusted service-role administrator bootstrap path.
-- This does not assign any role; only a separate, deliberate operator action can.
grant select on public.users to service_role;
grant update (role) on public.users to service_role;

-- Rate limits and contact/notification/engagement writes use already-scoped RPCs.
-- Dormant seeker/payment tables receive no new grants. Managed Storage is untouched.
commit;
