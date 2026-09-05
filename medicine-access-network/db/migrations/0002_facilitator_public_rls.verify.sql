-- ============================================================================
-- Verification script for migration 0002 — run manually in the Supabase SQL
-- editor AFTER 0001 and 0002 have been applied. Not part of the deploy path.
--
-- Run this whole file as-is. It seeds throwaway test rows, checks anon
-- access against each status/visibility combination, and cleans up after
-- itself. Safe to run against a dev/staging project; do not run against
-- production data (it does briefly touch auth.users).
-- ============================================================================

begin;

-- ─── Seed one throwaway facilitator per combination ────────────────────────

do $$
declare
  uid_pending    uuid := '00000000-0000-0000-0000-0000000000a1';
  uid_rejected   uuid := '00000000-0000-0000-0000-0000000000a2';
  uid_suspended  uuid := '00000000-0000-0000-0000-0000000000a3';
  uid_hidden     uuid := '00000000-0000-0000-0000-0000000000a4';
  uid_unlisted   uuid := '00000000-0000-0000-0000-0000000000a5';
  uid_visible    uuid := '00000000-0000-0000-0000-0000000000a6';
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
  values
    (uid_pending,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-pending@example.com',   crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Pending","role":"facilitator"}'::jsonb, now(), now(), '', ''),
    (uid_rejected,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-rejected@example.com',  crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Rejected","role":"facilitator"}'::jsonb, now(), now(), '', ''),
    (uid_suspended, '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-suspended@example.com', crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Suspended","role":"facilitator"}'::jsonb, now(), now(), '', ''),
    (uid_hidden,    '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-hidden@example.com',    crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Hidden","role":"facilitator"}'::jsonb, now(), now(), '', ''),
    (uid_unlisted,  '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-unlisted@example.com',  crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Unlisted","role":"facilitator"}'::jsonb, now(), now(), '', ''),
    (uid_visible,   '00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-test-visible@example.com',   crypt('x', gen_salt('bf')), now(), '{"full_name":"RLS Test Visible","role":"facilitator"}'::jsonb, now(), now(), '', '')
  on conflict (id) do nothing;

  insert into public.users (id, email, full_name, role) values
    (uid_pending,   'rls-test-pending@example.com',   'RLS Test Pending',   'facilitator'),
    (uid_rejected,  'rls-test-rejected@example.com',  'RLS Test Rejected',  'facilitator'),
    (uid_suspended, 'rls-test-suspended@example.com', 'RLS Test Suspended', 'facilitator'),
    (uid_hidden,    'rls-test-hidden@example.com',    'RLS Test Hidden',    'facilitator'),
    (uid_unlisted,  'rls-test-unlisted@example.com',  'RLS Test Unlisted',  'facilitator'),
    (uid_visible,   'rls-test-visible@example.com',   'RLS Test Visible',   'facilitator')
  on conflict (id) do nothing;

  insert into public.facilitator_profiles
    (user_id, display_name, bio, verification_status, visibility)
  values
    (uid_pending,   'RLS Test Pending',   repeat('x', 100), 'pending',   'public'),
    (uid_rejected,  'RLS Test Rejected',  repeat('x', 100), 'rejected',  'public'),
    (uid_suspended, 'RLS Test Suspended', repeat('x', 100), 'suspended', 'public'),
    (uid_hidden,    'RLS Test Hidden',    repeat('x', 100), 'approved',  'hidden'),
    (uid_unlisted,  'RLS Test Unlisted',  repeat('x', 100), 'approved',  'unlisted'),
    (uid_visible,   'RLS Test Visible',   repeat('x', 100), 'approved',  'public')
  on conflict (user_id) do nothing;
end $$;

-- ─── Switch to anon and check ───────────────────────────────────────────────
-- If your SQL editor has a role selector, you can use that instead of
-- `set role`. `set role` is the portable option and works the same way.

set local role anon;

-- 1. Pending facilitator must return 0 rows via both the view and the base table.
select 'pending via view'  as case_name, count(*) as row_count
from public.facilitator_public_profiles where display_name = 'RLS Test Pending';
select 'pending via table' as case_name, count(*) as row_count
from public.facilitator_profiles where display_name = 'RLS Test Pending';

-- 2. Rejected facilitator must return 0 rows.
select 'rejected via view'  as case_name, count(*) as row_count
from public.facilitator_public_profiles where display_name = 'RLS Test Rejected';
select 'rejected via table' as case_name, count(*) as row_count
from public.facilitator_profiles where display_name = 'RLS Test Rejected';

-- 3. Approved-but-hidden facilitator must return 0 rows.
select 'hidden via view'  as case_name, count(*) as row_count
from public.facilitator_public_profiles where display_name = 'RLS Test Hidden';
select 'hidden via table' as case_name, count(*) as row_count
from public.facilitator_profiles where display_name = 'RLS Test Hidden';

-- 4. Bonus — suspended and unlisted should also return 0 rows.
select 'suspended via view' as case_name, count(*) as row_count
from public.facilitator_public_profiles where display_name = 'RLS Test Suspended';
select 'unlisted via view'  as case_name, count(*) as row_count
from public.facilitator_public_profiles where display_name = 'RLS Test Unlisted';

-- 5. Control case — approved + public MUST return exactly 1 row via the view,
--    with only the safe columns present.
select 'visible via view (expect 1 row)' as case_name, *
from public.facilitator_public_profiles where display_name = 'RLS Test Visible';

-- 6-8 are each expected to ERROR. Postgres aborts the whole transaction on
-- the first error unless you isolate it behind a SAVEPOINT, so each check
-- below gets its own savepoint + rollback-to-savepoint — that way all three
-- run and report independently instead of the 2nd/3rd silently failing with
-- a generic "transaction aborted" once the 1st one errors.

-- 6. Anon must not be able to read user_id / verification_status / visibility
--    off the base table even for the one row RLS does allow (approved+public).
--    Expect: "permission denied for table facilitator_profiles"
--    (column-privilege violation) — that error IS the pass condition.
savepoint check_6;
select user_id from public.facilitator_profiles where display_name = 'RLS Test Visible';
rollback to savepoint check_6;

-- 7. public.users must be fully unreachable — expect a permission-denied error.
savepoint check_7;
select * from public.users limit 1;
rollback to savepoint check_7;

-- 8. anon must not be able to insert into public.users — expect a
--    permission-denied error (table-level), not just an RLS rejection.
savepoint check_8;
insert into public.users (id, email, full_name, role)
values (gen_random_uuid(), 'anon-cannot-do-this@example.com', 'Should Fail', 'admin');
rollback to savepoint check_8;

reset role;

-- ─── Cleanup ─────────────────────────────────────────────────────────────────
-- Rolling back discards the seeded test rows and any (expected) errors above
-- without needing manual deletes. Change to COMMIT only if you want to
-- inspect the rows afterward — then delete them by hand.

rollback;
