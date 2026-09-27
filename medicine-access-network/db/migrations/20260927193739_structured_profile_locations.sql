begin;
alter table public.facilitator_profiles add column if not exists locations jsonb not null default '[]'::jsonb
  check (jsonb_typeof(locations) = 'array' and jsonb_array_length(locations) <= 5);
comment on column public.facilitator_profiles.locations is 'Structured owner-entered city, region code, and country code. The application validates against the country/region catalog and derives the public location text.';
commit;
