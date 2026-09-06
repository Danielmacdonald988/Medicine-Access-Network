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
  }
  // Reapplying the hardening migration must not fail or reopen access.
  await db.exec(migrations[3])
  await db.exec(migrations[4])

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
