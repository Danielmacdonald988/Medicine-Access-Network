# Supabase Setup Guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Set a strong database password and save it securely

## 2. Get your API keys

Supabase Dashboard → Settings → API:

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

## 3. Run the schema

Open the Supabase **SQL Editor** and run the full contents of `db/schema.sql`.

This creates:
- All tables (users, seeker_profiles, facilitator_profiles, booking_requests, reviews, verification_notes, facilitator_subscriptions)
- All enums, indexes, and triggers
- Row Level Security (RLS) policies
- `get_my_role()` security definer function
- `handle_new_user()` trigger on auth.users

> If you already have some tables from a previous run, use the migration comments in each table section to add only the new columns.

## 4. Configure Auth

### Email auth
Supabase Dashboard → Authentication → Providers → Email:
- Enable email confirmations (recommended for production)
- Optionally disable for development: set "Email Confirmations" to off

### Auth redirect URLs
Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**: your app URL (e.g. `https://yourdomain.com`)
- **Redirect URLs**: add `https://yourdomain.com/**` and `http://localhost:3000/**`

## 5. Verify Row Level Security

In the Supabase Dashboard → Table Editor, confirm RLS is enabled on every table (shield icon = enabled). The schema.sql enables RLS on all tables.

You can verify with:
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

All tables should show `rowsecurity = true`.

## 6. Create the first admin user

After deploying the app, sign up with your admin email address normally. Then in the Supabase SQL Editor, manually update the role:

```sql
update public.users
set role = 'admin'
where email = 'your-admin-email@example.com';
```

Only do this for known admin users. The admin role grants full access to facilitator verification.

## 7. Seed modalities (optional)

The `modalities` table can be populated from the constants in `lib/constants.ts`. Example seed:

```sql
insert into public.modalities (name, category, sort_order) values
  ('Integration Coaching', 'integration', 1),
  ('Preparation Coaching', 'preparation', 2),
  ('Breathwork', 'breathwork', 3),
  ('Holotropic Breathwork', 'breathwork', 4),
  ('Somatic Coaching', 'somatic', 5),
  ('Somatic Experiencing', 'somatic', 6),
  ('Meditation Guidance', 'meditation', 7),
  ('Mindfulness Coaching', 'meditation', 8),
  ('Spiritual Coaching', 'spiritual', 9),
  ('Psychedelic Integration', 'integration', 10),
  ('Kambo Education', 'education', 11),
  ('Recovery Support', 'recovery', 12),
  ('Harm Reduction Education', 'education', 13),
  ('Ceremony Preparation', 'preparation', 14);
```

## 8. Local development with Supabase CLI (optional)

If you want to run Supabase locally:

```bash
npm install -g supabase
supabase start
# Use the local keys output by supabase start in your .env.local
supabase db reset  # applies schema.sql
```

## Troubleshooting

**"relation does not exist"** — Run `db/schema.sql` in the SQL editor.

**Users can see other users' data** — Verify RLS is enabled and the policies match what's in `db/schema.sql`.

**Admin role not working** — Check that `get_my_role()` function exists and the user's row in `public.users` has `role = 'admin'`.

**Auth redirect loop** — Check that `NEXT_PUBLIC_APP_URL` matches the URL in Supabase's allowed redirect list.
