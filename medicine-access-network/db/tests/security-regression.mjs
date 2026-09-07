/**
 * Isolated PostgreSQL regression tests; never connects to a Supabase project.
 * Run npm run test:db after npm ci. PGLITE_PACKAGE_JSON may optionally
 * point to a separate test runtime; no production credentials are required.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'

const require = createRequire(process.env.PGLITE_PACKAGE_JSON || import.meta.url)
const { PGlite } = require('@electric-sql/pglite')
const { uuid_ossp } = require('@electric-sql/pglite/contrib/uuid_ossp')
const { pg_trgm } = require('@electric-sql/pglite/contrib/pg_trgm')
const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8')
const migrationNames = [
  '0001_facilitator_status_visibility.sql', '0002_facilitator_public_rls.sql',
  '0003_contact_without_account.sql', '0004_authorization_and_contact.sql',
  '0005_profile_media_links.sql',
  '0006_admin_application_notifications.sql',
]
const migrations = await Promise.all(migrationNames.map(name => readFile(new URL(`../migrations/${name}`, import.meta.url), 'utf8')))
let assertions = 0

for (const mode of ['fresh schema', 'existing schema upgrade']) {
  const db = new PGlite({ extensions: { uuid_ossp, pg_trgm } })
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text unique, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create publication supabase_realtime;
    -- Minimal real tables, grants and RLS for Supabase Storage. Broad pre-existing
    -- policies deliberately exercise migration 0005's restrictive bucket policy.
    create schema storage;
    create table storage.buckets (
      id text primary key, name text not null, public boolean not null default false,
      file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (
      id uuid primary key, bucket_id text references storage.buckets(id),
      name text not null, unique(bucket_id, name)
    );
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on all tables in schema storage to anon, authenticated, service_role;
    alter table storage.buckets enable row level security;
    alter table storage.objects enable row level security;
    create policy "existing bucket access" on storage.buckets for all to anon, authenticated
      using (true) with check (true);
    create policy "existing object access" on storage.objects for all to anon, authenticated
      using (true) with check (true);
  `)
  if (mode === 'fresh schema') await db.exec(schema)
  else {
    await db.exec(schema.split('-- Included migration:')[0])
    for (const migration of migrations.slice(0, 4)) await db.exec(migration)
    // This real legacy record proves 0005 does not delete, hide or reject old
    // profiles merely because the new image field starts empty.
    await db.exec(`
      insert into auth.users(id,email) values ('10000000-0000-0000-0000-000000000070','legacy@example.test');
      insert into public.facilitator_profiles(user_id,display_name,bio,verification_status,visibility)
      values ('10000000-0000-0000-0000-000000000070','Legacy guide',repeat('x',100),'approved','public');
    `)
    await db.exec(migrations[4])
    // A pending application predates 0006; the upgrade must include it exactly
    // once without generating a duplicate on later migration reapplications.
    await db.exec(`
      insert into auth.users(id,email) values ('10000000-0000-0000-0000-000000000071','pending-before-upgrade@example.test');
      insert into storage.objects(id,bucket_id,name) values (
        '10000000-0000-0000-0000-000000000072','profile-images',
        '10000000-0000-0000-0000-000000000071/10000000-0000-0000-0000-000000000072.webp'
      );
      insert into public.facilitator_profiles(id,user_id,display_name,bio,image_paths)
      values ('10000000-0000-0000-0000-000000000073','10000000-0000-0000-0000-000000000071',
        'Existing applicant',repeat('x',100),
        array['10000000-0000-0000-0000-000000000071/10000000-0000-0000-0000-000000000072.webp']);
    `)
    await db.exec(migrations[5])
  }
  // Reapplying the hardening migration must not fail or reopen access.
  await db.exec(migrations[3])
  await db.exec(migrations[4])
  await db.exec(migrations[5])

  const id = n => `10000000-0000-0000-0000-${String(n).padStart(12, '0')}`
  const guide = id(1), otherGuide = id(2), seeker = id(3), admin = id(4), applicant = id(5), recovery = id(6)
  const imagePath = (uid, number = 1) => `${uid}/${id(100 + number)}.webp`
  for (const [uid, role] of [[guide, 'facilitator'], [otherGuide, 'facilitator'], [seeker, 'seeker'], [admin, 'admin'], [applicant, 'admin'], [recovery, 'admin']]) {
    await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [uid, `${uid}@example.test`, JSON.stringify({ full_name: 'Test user', role })])
  }
  const row = async (sql, args=[]) => (await db.query(sql, args)).rows[0]
  const check = (condition, label) => { assert.ok(condition, `${mode}: ${label}`); assertions++ }
  const denied = async (sql, args=[], code='42501') => {
    await assert.rejects(db.query(sql,args), error => error.code === code, `${mode}: forbidden operation must fail with ${code}`)
    assertions++
  }
  const as = async (role, uid='') => {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid])
    await db.exec(`set role ${role}`)
  }

  if (mode === 'existing schema upgrade') {
    const legacy = await row('select image_paths,verification_status,visibility from public.facilitator_profiles where user_id=$1',[id(70)])
    check(legacy.image_paths.length === 0 && legacy.verification_status === 'approved' && legacy.visibility === 'public', 'existing empty profile remains unchanged during migration')
    await denied("update public.facilitator_profiles set display_name='Changed' where user_id=$1", [id(70)], '23514')
    await db.query('delete from public.facilitator_profiles where user_id=$1',[id(70)])
    check((await row('select count(*)::int as total from public.admin_application_notifications where profile_id=$1',[id(73)])).total === 1, 'existing pending application is queued once after repeated migration')
    await db.query('delete from public.facilitator_profiles where user_id=$1',[id(71)])
    check((await row('select count(*)::int as total from public.admin_application_notifications where profile_id=$1',[id(73)])).total === 0, 'deleting a profile removes its private notification')
    check((await row('select count(*)::int as total from public.admin_application_notification_limits where user_id=$1',[id(71)])).total === 1, 'deleting a profile preserves its account notification budget')
    await db.query('delete from auth.users where id=$1',[id(71)])
    check((await row('select count(*)::int as total from public.admin_application_notification_limits where user_id=$1',[id(71)])).total === 0, 'deleting an authentication account removes its notification budget')
  }
  const bucket = await row("select public,file_size_limit,allowed_mime_types from storage.buckets where id='profile-images'")
  check(!bucket.public && Number(bucket.file_size_limit) === 2097152 && bucket.allowed_mime_types.join() === 'image/webp', 'profile image bucket is private and limited to 2 MiB WebP files')
  await db.query("insert into storage.buckets(id,name,public) values ('unrelated','Unrelated',true)")
  await as('service_role')
  for (const uid of [guide, otherGuide, applicant]) {
    for (let n = 1; n <= 6; n++) {
      await db.query("insert into storage.objects(id,bucket_id,name) values ($1,'profile-images',$2)",[id(1000 + Number(uid.slice(-2))*10+n),imagePath(uid,n)])
    }
  }
  for (const role of ['anon','authenticated']) {
    await as(role, applicant)
    check((await row("select count(*)::int as total from storage.objects where bucket_id='profile-images'")).total === 0, `${role} cannot read private image objects`)
    check((await row("select count(*)::int as total from storage.buckets where id='profile-images'")).total === 0, `${role} cannot access private bucket configuration`)
    await denied("insert into storage.objects(id,bucket_id,name) values ($1,'profile-images',$2)",[id(9000),imagePath(applicant,9)])
    check((await db.query("update storage.objects set name='replaced.webp' where bucket_id='profile-images' returning id")).rows.length === 0, `${role} cannot replace private objects`)
    check((await db.query("delete from storage.objects where bucket_id='profile-images' returning id")).rows.length === 0, `${role} cannot delete private objects`)
    check((await db.query("update storage.buckets set public=true where id='profile-images' returning id")).rows.length === 0, `${role} cannot make the bucket public`)
    await db.query("insert into storage.objects(id,bucket_id,name) values ($1,'unrelated','unrelated.webp')",[id(9000)])
    check((await row("select count(*)::int as total from storage.objects where bucket_id='unrelated'")).total === 1, `${role} retains access allowed by other bucket policies`)
    await denied("update storage.objects set bucket_id='profile-images',name=$1 where id=$2",[imagePath(applicant,9),id(9000)])
    await db.query("delete from storage.objects where bucket_id='unrelated'")
  }
  await as('postgres')

  check((await row('select role from public.users where id=$1',[applicant])).role === 'facilitator', 'signup metadata cannot create admin')
  await db.query("update public.users set role='seeker' where id=$1",[seeker])
  await as('service_role')
  await db.query("update public.users set role='admin' where id=$1",[admin])
  check((await row('select role from public.users where id=$1',[admin])).role === 'admin','service role can bootstrap admin')
  await as('postgres')
  await db.query('delete from public.users where id=$1',[recovery])
  await as('authenticated',recovery)
  await denied('insert into public.users(id,email,role) values($1,$2,$3)',[recovery,'recovery@example.test','admin'])
  await db.query('insert into public.users(id,email,role) values($1,$2,$3)',[recovery,'recovery@example.test','facilitator'])
  check((await row('select role from public.users where id=$1',[recovery])).role === 'facilitator','own missing profile can recover without admin')
  await denied('update public.users set role=$1 where id=$2',['admin',recovery])
  await denied('update public.users set id=$1 where id=$2',[id(99),recovery])
  await db.query("update public.users set full_name='Updated name' where id=$1",[recovery])
  check((await row('select full_name from public.users where id=$1',[recovery])).full_name === 'Updated name','name updates still work')

  await as('authenticated',applicant)
  await denied("insert into public.facilitator_profiles(user_id,display_name,bio,verification_status,visibility,image_paths) values($1,'Applicant',repeat('a',100),'approved','public',$2)",[applicant,[imagePath(applicant)]])
  const insertProfile = "insert into public.facilitator_profiles(user_id,display_name,bio,image_paths) values($1,'Applicant',repeat('a',100),$2)"
  await denied(insertProfile,[applicant,[]],'23514')
  await denied(insertProfile,[applicant,[imagePath(otherGuide)]],'23514')
  await denied(insertProfile,[applicant,[imagePath(applicant,99)]],'23514')
  await denied(insertProfile,[applicant,[imagePath(applicant),imagePath(applicant)]],'23514')
  await denied(insertProfile,[applicant,[null]],'23514')
  await denied(insertProfile,[applicant,[`${applicant}/../${id(101)}.webp`]],'23514')
  await denied(insertProfile,[applicant,Array.from({length:6},(_,n)=>imagePath(applicant,n+1))],'23514')
  await db.query(insertProfile,[applicant,[imagePath(applicant)]])
  check((await row('select verification_status,visibility from public.facilitator_profiles where user_id=$1',[applicant])).visibility === 'hidden','onboarding stays hidden')
  await denied("update public.facilitator_profiles set verification_status='approved',visibility='public' where user_id=$1",[applicant])
  await as('authenticated',admin)
  await db.query("update public.facilitator_profiles set verification_status='approved',visibility='public' where user_id=$1",[applicant])
  check((await row('select verification_status from public.facilitator_profiles where user_id=$1',[applicant])).verification_status === 'approved','administrator can review and publish')
  await as('authenticated',applicant)
  await denied("update public.facilitator_profiles set bio=repeat('b',100) where user_id=$1",[applicant])
  await db.query("insert into public.facilitator_profiles(user_id,display_name,bio,verification_status,visibility,image_paths) values($1,'Applicant',repeat('b',100),'pending','hidden',$2) on conflict (user_id) do update set display_name=excluded.display_name,bio=excluded.bio,verification_status=excluded.verification_status,visibility=excluded.visibility,image_paths=excluded.image_paths",[applicant,[imagePath(applicant)]])
  check((await row('select verification_status from public.facilitator_profiles where user_id=$1',[applicant])).verification_status === 'pending','onboarding upsert resubmits existing profile for review')

  const orderedImages = [imagePath(applicant,3),imagePath(applicant,1),imagePath(applicant,5),imagePath(applicant,2),imagePath(applicant,4)]
  await db.query('update public.facilitator_profiles set image_paths=$1 where user_id=$2',[orderedImages,applicant])
  check(JSON.stringify((await row('select image_paths from public.facilitator_profiles where user_id=$1',[applicant])).image_paths) === JSON.stringify(orderedImages), 'five uploaded photographs preserve owner-selected primary image order')
  await denied('update public.facilitator_profiles set image_paths=$1 where user_id=$2',[[],applicant],'23514')
  await denied('update public.facilitator_profiles set image_paths=$1 where user_id=$2',[[imagePath(otherGuide)],applicant],'23514')
  await denied('update public.facilitator_profiles set image_paths=$1 where user_id=$2',[[imagePath(applicant,99)],applicant],'23514')
  await denied('update public.facilitator_profiles set image_paths=$1::text[] where user_id=$2',[[[imagePath(applicant)],[imagePath(applicant,2)]],applicant],'23514')

  const messageLinks = {
    whatsapp_url: 'https://wa.me/12025550123',
    signal_url: `https://signal.me/#eu/${'a'.repeat(64)}`,
    telegram_url: 'https://t.me/Test_Guide',
  }
  for (const [column,value] of Object.entries(messageLinks)) {
    await db.query(`update public.facilitator_profiles set ${column}=$1 where user_id=$2`,[value,applicant])
    check((await row(`select ${column} as url from public.facilitator_profiles where user_id=$1`,[applicant])).url === value, `${column} accepts a supported direct-message destination`)
  }
  await db.query('update public.facilitator_profiles set signal_url=$1 where user_id=$2',['https://signal.me/#p/+12025550123',applicant])
  check((await row('select signal_url from public.facilitator_profiles where user_id=$1',[applicant])).signal_url === 'https://signal.me/#p/+12025550123', 'Signal phone-number link is supported')
  const invalidLinks = {
    whatsapp_url: ['https://wa.me/0123456789','https://wa.me/123456','https://wa.me/1234567890123456','https://wa.me/12025550123?text=hello','https://wa.me.evil.test/12025550123','https://wa.me/12025550123/','https://wa.me/12025550123\n'],
    signal_url: ['https://signal.me/#p/12025550123',`https://signal.me/#eu/${'a'.repeat(63)}`,`https://signal.me/#eu/${'a'.repeat(65)}`,`https://signal.me/#eu/${'a'.repeat(63)}=`,`https://signal.me/#eu/${'a'.repeat(64)}?x=1`,'https://signal.me/#p/+0123456789'],
    telegram_url: ['https://t.me/share','https://t.me/JoinChat','https://t.me/AddStickers','https://t.me/1person','https://t.me/shortname/','https://t.me/shortname?start=1','https://t.me/+InviteCode','https://t.me.evil.test/shortname','https://t.me/abcde%0a'],
  }
  for (const [column,values] of Object.entries(invalidLinks)) {
    for (const value of [...values,'','javascript:alert(1)']) {
      await denied(`update public.facilitator_profiles set ${column}=$1 where user_id=$2`,[value,applicant],'23514')
    }
    await db.query(`update public.facilitator_profiles set ${column}=null where user_id=$1`,[applicant])
  }
  check((await row('select whatsapp_url,signal_url,telegram_url from public.facilitator_profiles where user_id=$1',[applicant])).whatsapp_url === null, 'direct-message links remain optional and removable')

  await as('postgres')
  await db.query("insert into public.facilitator_profiles(id,user_id,display_name,bio,verification_status,visibility,image_paths) values($1,$2,'Public guide',repeat('x',100),'approved','public',$5),($3,$4,'Hidden guide',repeat('x',100),'approved','hidden',$6)",[id(11),guide,id(12),otherGuide,[imagePath(guide)],[imagePath(otherGuide)]])
  await db.query('update public.facilitator_profiles set whatsapp_url=$1,signal_url=$2,telegram_url=$3 where user_id in ($4,$5)',[...Object.values(messageLinks),guide,otherGuide])
  await db.query("insert into public.modalities(id,name,category) values($1,'Test practice','test')",[id(20)])
  await as('authenticated',guide)
  await denied('insert into public.facilitator_modalities(facilitator_id,modality_id) values($1,$2)',[id(11),id(20)])

  await as('anon')
  check((await row('select count(*)::int as total from public.facilitator_public_profiles')).total === 1,'public view excludes hidden/pending profiles')
  const publicMedia = await row('select image_paths,whatsapp_url,signal_url,telegram_url from public.facilitator_public_profiles')
  check(publicMedia.image_paths[0] === imagePath(guide) && publicMedia.whatsapp_url === messageLinks.whatsapp_url && publicMedia.signal_url === messageLinks.signal_url && publicMedia.telegram_url === messageLinks.telegram_url, 'public view exposes uploaded photo references and chosen contact links only for a published profile')
  await denied('select email from public.users')
  await denied('select user_id,visibility from public.facilitator_profiles')
  await denied('select * from public.booking_requests')
  await denied('select * from public.get_facilitator_contact_info($1)',[id(11)])
  await denied('select public.check_and_record_contact_rate_limit($1)', ['a'.repeat(64)])
  const submitSQL = 'select * from public.submit_contact_request($1,$2,$3,$4,$5,$6,$7,$8)'
  const args = [id(11),'a'.repeat(64),'Visitor','visitor@example.test','Integration','I would like to learn about your approach.','video',null]
  await denied(submitSQL,args)
  const directSQL = 'insert into public.booking_requests(facilitator_id,seeker_name,seeker_email,requested_service,message,preferred_format) values($1,$2,$3,$4,$5,$6)'
  await denied(directSQL,[guide,...args.slice(2,7)])
  await as('authenticated',guide)
  await denied(submitSQL,args)
  await denied('select * from public.get_facilitator_contact_info($1)',[id(11)])
  await denied(directSQL,[guide,...args.slice(2,7)])

  await as('service_role')
  check((await db.query(submitSQL,[id(12),...args.slice(1)])).rows.length === 0,'hidden guide cannot receive new contact')
  const first = await row(submitSQL,args)
  check(!!first.request_id && first.facilitator_email === `${guide}@example.test`,'trusted contact RPC stores request and resolves notification')
  for(let n=0;n<4;n++) await db.query(submitSQL,args)
  await denied(submitSQL,args,'P0001')
  check((await row('select count(*)::int as total from public.booking_requests')).total === 5,'sixth attempt creates no message')
  check((await row('select bool_and(seeker_id is null and status=\'pending\') as valid from public.booking_requests')).valid,'anonymous messages start pending without an account')
  check((await row("select bool_and(ip_address ~ '^[a-f0-9]{64}$') as valid from public.contact_rate_limits")).valid,'rate limiter stores opaque keys only')
  check((await row('select public.check_and_record_contact_rate_limit($1,0,999) as allowed',['b'.repeat(64)])).allowed === false,'caller cannot change fixed rate-limit policy')
  check((await row('select public.check_and_record_contact_rate_limit($1) as allowed',['203.0.113.1'])).allowed === false,'raw IP storage refused')
  await db.query(submitSQL,[args[0],'b'.repeat(64),...args.slice(2)])
  await as('authenticated',otherGuide)
  check((await row('select count(*)::int as total from public.booking_requests')).total === 0,'other guides cannot read private inquiries')
  await as('authenticated',guide)
  await denied('update public.booking_requests set seeker_id=$1 where id=$2',[seeker,first.request_id])
  await denied("update public.booking_requests set payment_status='paid' where id=$1",[first.request_id])
  await db.query("update public.booking_requests set status='accepted' where id=$1",[first.request_id])
  check((await row('select status from public.booking_requests where id=$1',[first.request_id])).status === 'accepted','recipient can update status')

  await as('postgres')
  await db.query("insert into public.booking_requests(id,seeker_id,facilitator_id,requested_service,message,preferred_format,status) values($1,$2,$3,'Integration',repeat('x',20),'video','completed')",[id(30),seeker,guide])
  await as('authenticated',seeker)
  const reviewSQL="insert into public.reviews(booking_request_id,seeker_id,facilitator_id,rating,text,safety_rating,integration_rating) values($1,$2,$3,5,repeat('x',20),5,5)"
  await denied(reviewSQL,[id(30),seeker,otherGuide])
  await db.query(reviewSQL,[id(30),seeker,guide])
  check((await row('select count(*)::int as total from public.reviews')).total === 1,'legacy review must match actual completed booking parties')

  // Notification state never lives in owner-writable profile columns. Exercise
  // the real trigger and claims in PostgreSQL rather than a mocked queue.
  await as('postgres')
  await db.query('delete from public.admin_application_notifications')
  const notificationOwner = id(20001), notificationProfile = id(21001)
  for (let n = 1; n <= 3; n++) {
    const owner = id(20000 + n), profile = id(21000 + n)
    await db.query('insert into auth.users(id,email) values($1,$2)',[owner,`notification-${n}@example.test`])
    await db.query("insert into storage.objects(id,bucket_id,name) values($1,'profile-images',$2)",[id(22000 + n),imagePath(owner)])
    await as('authenticated',owner)
    await db.query("insert into public.facilitator_profiles(id,user_id,display_name,bio,image_paths) values($1,$2,'New application',repeat('x',100),$3)",[profile,owner,[imagePath(owner)]])
    await as('postgres')
  }
  const claimSQL = 'select * from public.claim_admin_application_notifications($1,$2)'
  const finishSQL = 'select public.finish_admin_application_notification($1,$2,$3) as finished'
  const notificationSQL = 'select * from public.admin_application_notifications where profile_id=$1'
  const budgetSQL = 'select * from public.admin_application_notification_limits where user_id=$1'
  const initialNotification = await row(notificationSQL,[notificationProfile])
  check(initialNotification.pending && initialNotification.attempts === 0, 'new application queues one unsent event atomically')
  check((await row('select count(*)::int as total from public.admin_application_notifications')).total === 3, 'each submitted profile receives only one notification row')
  check((await row("select relrowsecurity from pg_class where oid='public.admin_application_notifications'::regclass")).relrowsecurity, 'notification table has row level security enabled')
  check((await row("select relrowsecurity from pg_class where oid='public.admin_application_notification_limits'::regclass")).relrowsecurity, 'account dispatch budgets have row level security enabled')
  for (const [role,uid] of [['anon',''],['authenticated',notificationOwner],['authenticated',admin]]) {
    await as(role,uid)
    await denied('select * from public.admin_application_notifications')
    await denied('insert into public.admin_application_notifications(profile_id) values($1)',[notificationProfile])
    await denied('update public.admin_application_notifications set pending=false')
    await denied('delete from public.admin_application_notifications')
    await denied('select * from public.admin_application_notification_limits')
    await denied('insert into public.admin_application_notification_limits(user_id) values($1)',[notificationOwner])
    await denied('update public.admin_application_notification_limits set window_attempts=0')
    await denied('delete from public.admin_application_notification_limits')
    await denied(claimSQL,[5,notificationProfile])
    await denied(finishSQL,[initialNotification.id,id(99999),true])
    check(!(await row("select has_function_privilege(current_user,'public.enqueue_admin_application_notification()','EXECUTE') as allowed")).allowed, `${role} cannot invoke the definer enqueue function directly`)
  }
  await as('authenticated',otherGuide)
  check((await db.query("update public.facilitator_profiles set display_name='Not the owner' where id=$1 returning id",[notificationProfile])).rows.length === 0, 'other facilitators cannot cause resubmission notifications for another profile')

  await as('service_role')
  for (const limit of [0,21,null]) await denied(claimSQL,[limit,notificationProfile],'22023')
  check((await db.query(claimSQL,[5,id(99999)])).rows.length === 0, 'a nonexistent profile cannot produce notifications')
  const firstClaim = await row(claimSQL,[5,notificationProfile])
  check(firstClaim.id === initialNotification.id && firstClaim.profile_id === notificationProfile && !!firstClaim.claim_token, 'service role claims the scoped event with an opaque token')
  check((await db.query(claimSQL,[5,notificationProfile])).rows.length === 0, 'a concurrent dispatcher cannot claim an active lease')
  check(!(await row(finishSQL,[firstClaim.id,id(99999),true])).finished, 'a forged completion token cannot mark an event delivered')
  check(!(await row(finishSQL,[firstClaim.id,firstClaim.claim_token,null])).finished, 'a missing delivery result cannot acknowledge an event')
  await as('authenticated',notificationOwner)
  await db.query("update public.facilitator_profiles set display_name='Updated during delivery' where id=$1",[notificationProfile])
  await as('service_role')
  const coalesced = await row(notificationSQL,[notificationProfile])
  check(coalesced.id === firstClaim.id && coalesced.claim_token === firstClaim.claim_token, 'edits during delivery coalesce without changing its event or lease')
  await db.query("update public.admin_application_notifications set lease_expires_at=now()-interval '1 second' where profile_id=$1",[notificationProfile])
  await db.query("update public.admin_application_notification_limits set lease_expires_at=now()-interval '1 second' where user_id=$1",[notificationOwner])
  const reclaimed = await row(claimSQL,[5,notificationProfile])
  check(reclaimed.id === firstClaim.id && reclaimed.claim_token !== firstClaim.claim_token, 'an abandoned lease is reclaimable with the same idempotency ID and a new token')
  check(!(await row(finishSQL,[firstClaim.id,firstClaim.claim_token,true])).finished, 'a late worker cannot acknowledge a replacement claim')
  check((await row(finishSQL,[reclaimed.id,reclaimed.claim_token,false])).finished, 'delivery failure releases the owned lease')
  const failed = await row(notificationSQL,[notificationProfile])
  check(failed.pending && failed.claim_token === null && failed.attempts === 2, 'failed events remain pending and retain attempt state')
  check((await row("select next_attempt_at >= now()+interval '110 seconds' as backed_off from public.admin_application_notifications where profile_id=$1",[notificationProfile])).backed_off, 'successive failures impose exponential retry backoff')
  check((await db.query(claimSQL,[5,notificationProfile])).rows.length === 0, 'retry requests cannot bypass delivery backoff')
  await as('authenticated',notificationOwner)
  await db.query("update public.facilitator_profiles set display_name='Updated while retrying' where id=$1",[notificationProfile])
  await as('service_role')
  const failedAfterEdit = await row(notificationSQL,[notificationProfile])
  check(failedAfterEdit.id === failed.id && new Date(failedAfterEdit.next_attempt_at).getTime() === new Date(failed.next_attempt_at).getTime(), 'rapid profile edits do not reset a failed event or its retry backoff')
  await db.query("update public.admin_application_notifications set next_attempt_at=now()-interval '1 second' where profile_id=$1",[notificationProfile])
  await db.query("update public.admin_application_notification_limits set next_attempt_at=now()-interval '1 second' where user_id=$1",[notificationOwner])
  const retry = await row(claimSQL,[5,notificationProfile])
  check((await row(finishSQL,[retry.id,retry.claim_token,true])).finished, 'successful provider delivery can acknowledge the retried event')
  check(!(await row(finishSQL,[retry.id,retry.claim_token,true])).finished, 'repeated acknowledgements cannot mutate a delivered event')
  const delivered = await row(notificationSQL,[notificationProfile])
  check(!delivered.pending && !!delivered.last_sent_at && delivered.claim_token === null, 'accepted delivery closes the event and clears the lease')

  await as('authenticated',notificationOwner)
  await db.query('update public.facilitator_profiles set display_name=display_name where id=$1',[notificationProfile])
  await as('service_role')
  check(!(await row(notificationSQL,[notificationProfile])).pending, 'unchanged resubmission does not send another email')
  await as('authenticated',admin)
  await db.query("update public.facilitator_profiles set verification_status='approved',visibility='public' where id=$1",[notificationProfile])
  await db.query("update public.facilitator_profiles set verification_status='pending',visibility='hidden' where id=$1",[notificationProfile])
  await as('service_role')
  check(!(await row(notificationSQL,[notificationProfile])).pending, 'admin approval and a subsequent admin review decision do not enqueue application emails')
  await as('authenticated',notificationOwner)
  await db.query("update public.facilitator_profiles set display_name='A meaningful new revision' where id=$1",[notificationProfile])
  await as('service_role')
  const newEvent = await row(notificationSQL,[notificationProfile])
  check(newEvent.pending && newEvent.id !== delivered.id && newEvent.attempts === 0, 'a meaningful owner revision after delivery queues a new event')
  check((await row("select next_attempt_at >= last_sent_at+interval '15 minutes' as cooled_down from public.admin_application_notifications where profile_id=$1",[notificationProfile])).cooled_down, 'rapid resubmissions are retained behind a fifteen-minute delivery cooldown')
  check((await db.query(claimSQL,[5,notificationProfile])).rows.length === 0, 'immediate dispatch cannot bypass the successful-send cooldown')
  await db.query("update public.admin_application_notifications set next_attempt_at=now()-interval '1 second', window_attempts=8 where profile_id=$1",[notificationProfile])
  await db.query("update public.admin_application_notification_limits set next_attempt_at=now()-interval '1 second', window_attempts=8 where user_id=$1",[notificationOwner])
  check((await db.query(claimSQL,[5,notificationProfile])).rows.length === 0, 'a profile cannot be claimed more than eight times in one hour')
  await db.query("update public.admin_application_notifications set attempt_window_started_at=now()-interval '61 minutes', attempts=8 where profile_id=$1",[notificationProfile])
  await db.query("update public.admin_application_notification_limits set attempt_window_started_at=now()-interval '61 minutes', attempts=8 where user_id=$1",[notificationOwner])
  const laterClaim = await row(claimSQL,[5,notificationProfile])
  check(!!laterClaim && (await row(notificationSQL,[notificationProfile])).window_attempts === 1, 'retained work becomes claimable again when its hourly attempt window expires')
  await as('postgres')
  await db.exec(migrations[5])
  const afterReapply = await row(notificationSQL,[notificationProfile])
  check(afterReapply.id === laterClaim.id && afterReapply.claim_token === laterClaim.claim_token && afterReapply.attempts === 8, 'reapplying migration preserves pending IDs, leases and attempt counts')
  await as('service_role')
  await db.query(finishSQL,[laterClaim.id,laterClaim.claim_token,false])
  check((await row("select next_attempt_at >= now()+interval '59 minutes' and next_attempt_at <= now()+interval '61 minutes' as bounded from public.admin_application_notifications where profile_id=$1",[notificationProfile])).bounded, 'retry backoff is capped at an hour without discarding pending work')

  await as('authenticated',admin)
  await db.query("update public.facilitator_profiles set verification_status='rejected',visibility='hidden' where id=$1",[id(21002)])
  await as('service_role')
  check((await db.query(claimSQL,[5,id(21002)])).rows.length === 0, 'already reviewed profiles are excluded even with an old pending notification')
  await as('authenticated',id(20002))
  await db.query("update public.facilitator_profiles set verification_status='pending',visibility='hidden' where id=$1",[id(21002)])
  await as('service_role')
  check((await db.query(claimSQL,[5,id(21002)])).rows.length === 1, 'owner resubmission after rejection makes coalesced work eligible again')
  const boundedBatch = (await db.query(claimSQL,[1,null])).rows
  check(boundedBatch.length === 1, 'unscoped dispatch respects its bounded batch size')

  // Owners may delete their own profiles. Exercise that exact permission, not
  // a privileged shortcut, to ensure new profile IDs cannot reset mail limits.
  const recreatingOwner = id(20100)
  await as('postgres')
  await db.query('insert into auth.users(id,email) values($1,$2)',[recreatingOwner,'recreating-owner@example.test'])
  await db.query("insert into storage.objects(id,bucket_id,name) values($1,'profile-images',$2)",[id(22100),imagePath(recreatingOwner)])
  const recreate = async (profileId) => {
    await as('authenticated',recreatingOwner)
    await db.query('delete from public.facilitator_profiles where user_id=$1',[recreatingOwner])
    await db.query("insert into public.facilitator_profiles(id,user_id,display_name,bio,image_paths) values($1,$2,'Recreated application',repeat('x',100),$3)",[profileId,recreatingOwner,[imagePath(recreatingOwner)]])
    await as('service_role')
  }
  await recreate(id(21100))
  const deletedClaim = await row(claimSQL,[5,id(21100)])
  await recreate(id(21101))
  check((await row('select count(*)::int as total from public.admin_application_notifications where id=$1',[deletedClaim.id])).total === 0, 'owner profile deletion removes the original event during an active send')
  const duringDeletion = await row(budgetSQL,[recreatingOwner])
  check(duringDeletion.claim_event_id === deletedClaim.id && duringDeletion.claim_token === deletedClaim.claim_token && duringDeletion.window_attempts === 1, 'account dispatch lease and hourly usage survive deletion and recreation')
  check((await db.query(claimSQL,[5,id(21101)])).rows.length === 0, 'a recreated profile cannot overlap an in-flight send for the same account')
  check((await row(finishSQL,[deletedClaim.id,deletedClaim.claim_token,true])).finished, 'accepted email can be acknowledged against its account after the profile was deleted')
  const acceptedAfterDeletion = await row(budgetSQL,[recreatingOwner])
  check(!!acceptedAfterDeletion.last_sent_at && acceptedAfterDeletion.claim_event_id === null, 'an accepted deleted-profile send still starts the account cooldown')
  check((await db.query(claimSQL,[5,id(21101)])).rows.length === 0, 'recreation before acknowledgement cannot bypass the subsequent send cooldown')
  await recreate(id(21102))
  check((await db.query(claimSQL,[5,id(21102)])).rows.length === 0, 'recreation after acknowledgement also preserves the fifteen-minute send cooldown')
  check((await row(budgetSQL,[recreatingOwner])).window_attempts === 1, 'repeated deletion cannot reset account claim usage')

  await db.query("update public.admin_application_notifications set next_attempt_at=now()-interval '1 second' where profile_id=$1",[id(21102)])
  await db.query("update public.admin_application_notification_limits set next_attempt_at=now()-interval '1 second' where user_id=$1",[recreatingOwner])
  const recreatedClaim = await row(claimSQL,[5,id(21102)])
  check(!!recreatedClaim && (await row(budgetSQL,[recreatingOwner])).window_attempts === 2, 'a legitimate recreated application becomes eligible after cooldown without losing prior usage')
  await db.query(finishSQL,[recreatedClaim.id,recreatedClaim.claim_token,false])
  const failureBeforeRecreation = await row(budgetSQL,[recreatingOwner])
  await recreate(id(21103))
  const failureAfterRecreation = await row(budgetSQL,[recreatingOwner])
  check(failureAfterRecreation.attempts === failureBeforeRecreation.attempts && new Date(failureAfterRecreation.next_attempt_at).getTime() === new Date(failureBeforeRecreation.next_attempt_at).getTime(), 'deletion and recreation retain account failure backoff')
  check((await db.query(claimSQL,[5,id(21103)])).rows.length === 0, 'a failed notification cannot bypass retry backoff through recreation')
  await db.query("update public.admin_application_notification_limits set window_attempts=8,next_attempt_at=now()-interval '1 second' where user_id=$1",[recreatingOwner])
  await recreate(id(21104))
  check((await db.query(claimSQL,[5,id(21104)])).rows.length === 0, 'a recreated profile cannot bypass an exhausted account hourly budget')
  await as('postgres')
  await db.query('delete from auth.users where id=$1',[recreatingOwner])
  check((await row('select count(*)::int as total from public.admin_application_notification_limits where user_id=$1',[recreatingOwner])).total === 0, 'deleting the authentication account cascades its private dispatch budget')
  check((await row('select count(*)::int as total from public.admin_application_notification_limits where user_id=$1',[notificationOwner])).total === 1, 'account deletion leaves other accounts notification budgets intact')

  await as('postgres')
  for (const table of ['buckets', 'objects']) {
    // Only the isolated Storage mock is altered. The production migration must
    // inspect managed RLS state and fail closed without attempting an ALTER.
    await db.exec(`alter table storage.${table} disable row level security`)
    await assert.rejects(db.exec(migrations[4]), error => error.code === '42501' && error.message === 'profile_images_require_storage_rls')
    assertions++
    await db.exec('rollback')
    await db.exec(`alter table storage.${table} enable row level security`)
    await db.exec(migrations[4])
  }
  await db.close()
  console.log(`PASS: ${mode}, including repeated migration`)
}
console.log(`PASS: ${assertions} PostgreSQL assertions; no external database contacted.`)
