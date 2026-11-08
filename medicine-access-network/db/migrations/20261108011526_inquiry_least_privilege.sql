-- Remove unused table-level privileges from untrusted API roles.
-- Normal inbox reads and owner-scoped UPDATE(status) remain unchanged.
-- No data, row policies, default privileges, or service-role grants change.
-- TRUNCATE is not constrained by RLS, so it must not be granted to API users.
begin;
revoke delete, truncate, references, trigger
  on table public.booking_requests from public, anon, authenticated;
commit;
