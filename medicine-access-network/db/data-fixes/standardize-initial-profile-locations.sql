-- One-time cleanup of the three entries reviewed on September 27, 2026.
-- Exact old labels and empty structured data protect concurrent owner edits.
begin;
do $$
declare changed integer;
begin
  with cleaned as (
    update public.facilitator_profiles p
    set location = fixes.display, locations = fixes.places
    from (values
      ('Ashley Elizabeth', 'Cary, NC, USA',
       'Cary, North Carolina, United States',
       '[{"city":"Cary","region":"NC","country":"US"}]'::jsonb),
      ('Madeline Pasqualini', 'Delray Beach, Florida ',
       'Delray Beach, Florida, United States',
       '[{"city":"Delray Beach","region":"FL","country":"US"}]'::jsonb),
      ('Dan', 'Boston, Ma and Playa del Carmen, Mexico',
       'Boston, Massachusetts, United States; Playa del Carmen, Quintana Roo, Mexico',
       '[{"city":"Boston","region":"MA","country":"US"},{"city":"Playa del Carmen","region":"ROO","country":"MX"}]'::jsonb)
    ) as fixes(name, original, display, places)
    where p.display_name = fixes.name and p.location = fixes.original and p.locations = '[]'::jsonb
    returning p.id
  ) select count(*) into changed from cleaned;
  if changed <> 3 then
    raise exception 'Expected exactly three unchanged profiles; found %. Review current data before retrying.', changed;
  end if;
end $$;
commit;
