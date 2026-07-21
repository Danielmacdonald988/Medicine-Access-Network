-- ============================================================================
-- The Facilitator Network — Seed Data
-- Run AFTER schema.sql.  For local development only.
-- ============================================================================

-- ─── Modalities ───────────────────────────────────────────────────────────────

insert into public.modalities (name, category, sort_order) values
  ('Integration Coaching',      'integration',  1),
  ('Psychedelic Integration',   'integration',  2),
  ('Preparation Coaching',      'preparation',  3),
  ('Ceremony Preparation',      'preparation',  4),
  ('Breathwork',                'breathwork',   5),
  ('Holotropic Breathwork',     'breathwork',   6),
  ('Somatic Coaching',          'somatic',      7),
  ('Somatic Experiencing',      'somatic',      8),
  ('Meditation Guidance',       'meditation',   9),
  ('Mindfulness Coaching',      'meditation',  10),
  ('Spiritual Coaching',        'spiritual',   11),
  ('Harm Reduction Education',  'education',   12),
  ('Kambo Education',           'education',   13),
  ('Recovery Support',          'recovery',    14)
on conflict (name) do nothing;

-- ─── Sample Facilitators ──────────────────────────────────────────────────────
-- Fictional personas for local dev / UI testing only.
-- auth.users rows are inserted first because facilitator_profiles.user_id
-- references public.users which references auth.users.
--
-- In production, users sign up via the app and the DB trigger creates their
-- public.users row automatically.  Never run this block in production.

do $$
declare
  uid_1  uuid := '00000000-0000-0000-0000-000000000001';
  uid_2  uuid := '00000000-0000-0000-0000-000000000002';
  uid_3  uuid := '00000000-0000-0000-0000-000000000003';
  uid_admin uuid := '00000000-0000-0000-0000-000000000099';
  fp_id_1 uuid;
  fp_id_2 uuid;
  fp_id_3 uuid;
begin

  -- Seed auth.users (bypasses normal signup flow — dev only)
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token
  ) values
  (
    uid_1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'maya.chen@example.com',
    crypt('password123', gen_salt('bf')), now(),
    '{"full_name":"Maya Chen","role":"facilitator"}'::jsonb,
    now(), now(), '', ''
  ),
  (
    uid_2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'james.okafor@example.com',
    crypt('password123', gen_salt('bf')), now(),
    '{"full_name":"James Okafor","role":"facilitator"}'::jsonb,
    now(), now(), '', ''
  ),
  (
    uid_3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'sara.wells@example.com',
    crypt('password123', gen_salt('bf')), now(),
    '{"full_name":"Sara Wells","role":"facilitator"}'::jsonb,
    now(), now(), '', ''
  ),
  (
    uid_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@example.com',
    crypt('admin123', gen_salt('bf')), now(),
    '{"full_name":"Platform Admin","role":"admin"}'::jsonb,
    now(), now(), '', ''
  )
  on conflict (id) do nothing;

  -- public.users rows are created by the on_auth_user_created trigger above,
  -- but insert directly here in case the trigger isn't enabled in this env.
  insert into public.users (id, email, full_name, role) values
    (uid_1,    'maya.chen@example.com',   'Maya Chen',       'facilitator'),
    (uid_2,    'james.okafor@example.com','James Okafor',    'facilitator'),
    (uid_3,    'sara.wells@example.com',  'Sara Wells',       'facilitator'),
    (uid_admin,'admin@example.com',       'Platform Admin',  'admin')
  on conflict (id) do nothing;

  -- ── Maya Chen ──────────────────────────────────────────────────────────────
  insert into public.facilitator_profiles (
    user_id, display_name, bio, location, remote_available,
    years_experience, lineage_or_training, safety_practices,
    contraindications_acknowledged, donation_based, hourly_rate,
    verification_status
  ) values (
    uid_1, 'Maya Chen',
    'I am a certified integration coach and somatic practitioner with over 8 years of experience supporting individuals through transformative experiences. My work draws from Internal Family Systems (IFS), somatic experiencing, and mindfulness-based practices. I specialise in helping clients integrate insights from plant medicine ceremonies and other non-ordinary states of consciousness into lasting, grounded change. I hold a safe, non-judgmental container and am trained in trauma-sensitive facilitation.',
    'Portland, OR', true, 8,
    'Internal Family Systems (IFS) — Level 2; Somatic Experiencing Practitioner (SEP); MAPS MDMA-AT Training',
    'I conduct thorough intake consultations to assess fit and screen for contraindications including active psychosis, certain medications (MAOIs, lithium), and recent trauma history. Sessions are trauma-informed and I maintain strict confidentiality. I have a crisis referral network and will always recommend professional medical or psychiatric care when indicated.',
    true, false, 150.00, 'approved'
  ) returning id into fp_id_1;

  -- Junction table entries for Maya
  insert into public.facilitator_modalities (facilitator_id, modality_id)
  select fp_id_1, id from public.modalities
  where name in ('Integration Coaching', 'Somatic Coaching', 'Somatic Experiencing', 'Psychedelic Integration')
  on conflict do nothing;

  -- ── James Okafor ───────────────────────────────────────────────────────────
  insert into public.facilitator_profiles (
    user_id, display_name, bio, location, remote_available,
    years_experience, lineage_or_training, safety_practices,
    contraindications_acknowledged, donation_based, minimum_donation,
    verification_status
  ) values (
    uid_2, 'James Okafor',
    'As a breathwork facilitator and spiritual coach, I have guided hundreds of individuals through transformative holotropic and conscious-connected breathwork sessions over the past 6 years. My lineage is rooted in the Grof Transpersonal Training framework, combined with 12 years of personal meditation practice in the Tibetan Buddhist tradition. I offer both one-on-one sessions and small group circles. My approach is heart-centred, grounded, and deeply respectful of each person''s unique journey.',
    'Austin, TX', true, 6,
    'Grof Transpersonal Training — Certified Holotropic Breathwork Facilitator; Tibetan Buddhist meditation — 12 years',
    'I screen all participants for cardiovascular conditions, history of psychosis or schizophrenia, severe PTSD, recent surgery, and pregnancy. Breathwork can produce intense experiences and is contraindicated in these populations. I provide written guidelines before every session and have trauma-informed training through the Hakomi Institute.',
    true, true, 75.00, 'approved'
  ) returning id into fp_id_2;

  insert into public.facilitator_modalities (facilitator_id, modality_id)
  select fp_id_2, id from public.modalities
  where name in ('Breathwork', 'Holotropic Breathwork', 'Meditation Guidance', 'Spiritual Coaching')
  on conflict do nothing;

  -- ── Sara Wells ─────────────────────────────────────────────────────────────
  insert into public.facilitator_profiles (
    user_id, display_name, bio, location, remote_available,
    years_experience, lineage_or_training, safety_practices,
    contraindications_acknowledged, donation_based, hourly_rate,
    verification_status
  ) values (
    uid_3, 'Sara Wells',
    'I am a preparation coach and harm reduction educator with a background in clinical social work. For 5 years I have helped people approach plant medicine work with intention, safety, and proper support structures in place. I do not facilitate ceremonies. My work is entirely in the preparation and post-experience integration space — helping clients set clear intentions, understand what to expect, identify contraindications, and build a support network before and after their experience.',
    'Denver, CO', true, 5,
    'MSW — University of Denver; MAPS harm reduction training; ZENDO Project trained',
    'As a social worker I maintain strict ethical guidelines. I complete full biopsychosocial assessments with every new client. I do not work with individuals in active psychosis, on contraindicated medications, or in acute psychiatric crisis. I provide written referral lists for medical and psychiatric support.',
    true, false, 120.00, 'approved'
  ) returning id into fp_id_3;

  insert into public.facilitator_modalities (facilitator_id, modality_id)
  select fp_id_3, id from public.modalities
  where name in ('Preparation Coaching', 'Ceremony Preparation', 'Harm Reduction Education', 'Integration Coaching')
  on conflict do nothing;

end $$;
