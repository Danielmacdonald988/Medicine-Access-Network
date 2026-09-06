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
  `)
  if (mode === 'fresh schema') await db.exec(schema)
  else {
    await db.exec(schema.split('-- Included migration:')[0])
    for (const migration of migrations) await db.exec(migration)
  }
  // Reapplying the hardening migration must not fail or reopen access.
  await db.exec(migrations[3])

  const id = n => `10000000-0000-0000-0000-${String(n).padStart(12, '0')}`
  const guide = id(1), otherGuide = id(2), seeker = id(3), admin = id(4), applicant = id(5), recovery = id(6)
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
  await denied("insert into public.facilitator_profiles(user_id,display_name,bio,verification_status,visibility) values($1,'Applicant',repeat('a',100),'approved','public')",[applicant])
  await db.query("insert into public.facilitator_profiles(user_id,display_name,bio) values($1,'Applicant',repeat('a',100))",[applicant])
  check((await row('select verification_status,visibility from public.facilitator_profiles where user_id=$1',[applicant])).visibility === 'hidden','onboarding stays hidden')
  await denied("update public.facilitator_profiles set verification_status='approved',visibility='public' where user_id=$1",[applicant])
  await as('authenticated',admin)
  await db.query("update public.facilitator_profiles set verification_status='approved',visibility='public' where user_id=$1",[applicant])
  check((await row('select verification_status from public.facilitator_profiles where user_id=$1',[applicant])).verification_status === 'approved','administrator can review and publish')
  await as('authenticated',applicant)
  await denied("update public.facilitator_profiles set bio=repeat('b',100) where user_id=$1",[applicant])
  await db.query("insert into public.facilitator_profiles(user_id,display_name,bio,verification_status,visibility) values($1,'Applicant',repeat('b',100),'pending','hidden') on conflict (user_id) do update set display_name=excluded.display_name,bio=excluded.bio,verification_status=excluded.verification_status,visibility=excluded.visibility",[applicant])
  check((await row('select verification_status from public.facilitator_profiles where user_id=$1',[applicant])).verification_status === 'pending','onboarding upsert resubmits existing profile for review')

  await as('postgres')
  await db.query("insert into public.facilitator_profiles(id,user_id,display_name,bio,verification_status,visibility) values($1,$2,'Public guide',repeat('x',100),'approved','public'),($3,$4,'Hidden guide',repeat('x',100),'approved','hidden')",[id(11),guide,id(12),otherGuide])
  await db.query("insert into public.modalities(id,name,category) values($1,'Test practice','test')",[id(20)])
  await as('authenticated',guide)
  await denied('insert into public.facilitator_modalities(facilitator_id,modality_id) values($1,$2)',[id(11),id(20)])

  await as('anon')
  check((await row('select count(*)::int as total from public.facilitator_public_profiles')).total === 1,'public view excludes hidden/pending profiles')
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
  await db.close()
  console.log(`PASS: ${mode}, including repeated migration`)
}
console.log(`PASS: ${assertions} PostgreSQL assertions; no external database contacted.`)
