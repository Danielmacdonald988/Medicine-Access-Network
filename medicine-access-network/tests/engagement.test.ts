import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { pageEvent, trafficSource } from '../lib/engagement'

test('coarse page signals and referral classification never include sensitive values', () => {
  assert.equal(pageEvent('/facilitators/private-id'), 'profile_view')
  assert.equal(pageEvent('/auth/callback'), null)
  assert.equal(pageEvent('/admin'), null)
  assert.equal(trafficSource('https://l.instagram.com/?private=secret', 'thefacilitatornetwork.com'), 'instagram')
  assert.equal(trafficSource('https://instagram.com.attacker.example/', 'thefacilitatornetwork.com'), 'other')
  assert.equal(trafficSource('https://www.thefacilitatornetwork.com/signup', 'thefacilitatornetwork.com'), 'direct')
  assert.equal(trafficSource('', 'thefacilitatornetwork.com'), 'direct')
})

test('engagement database protects events and correctly separates matured drop-offs from pending attempts', async () => {
  const db = new PGlite()
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role;')
    const migration = await readFile(new URL('../db/migrations/0007_engagement.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration) // repeatable deployment
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`)
      for (const sql of ['select * from public.engagement_events', 'select public.engagement_summary(30)', `select public.record_engagement('10000000-0000-4000-8000-000000000001','visit',0,'direct','mobile',repeat('a',64))`]) {
        await assert.rejects(db.query(sql), /permission denied/)
      }
      await db.exec('reset role')
    }
    await db.exec('set role service_role')
    await db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000001','visit',0,'direct','mobile',repeat('a',64))`)
    await db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000001','visit',0,'direct','mobile',repeat('a',64))`)
    await assert.rejects(db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000001','raw-email',0,'direct','mobile',repeat('a',64))`), /check constraint/)
    await assert.rejects(db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000001','application_step',15,'direct','mobile',repeat('a',64))`), /check constraint/)
    await db.exec(`
      insert into public.engagement_events(session_id,event,step,source,device,created_at) values
      ('10000000-0000-4000-8000-000000000001','signup_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000001','signup_accepted',0,'direct','mobile',now()-interval '47 hours'),
      ('10000000-0000-4000-8000-000000000002','signup_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000002','signup_accepted',0,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000003','signup_started',0,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000004','application_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000004','application_step',12,'direct','mobile',now()-interval '47 hours'),
      ('10000000-0000-4000-8000-000000000004','application_step',14,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000005','application_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000005','application_submitted',0,'direct','mobile',now()-interval '47 hours'),
      ('10000000-0000-4000-8000-000000000006','signup_started',0,'direct','mobile',now()-interval '40 days');
    `)
    const result = await db.query<{ value: { counts: Record<string,number>; funnels: Record<string,Record<string,number>>; last_steps: Record<string,number> } }>('select public.engagement_summary(30) as value')
    const metrics = result.rows[0].value
    assert.equal(metrics.counts.visit, 1)
    assert.deepEqual(metrics.funnels.signup_started, { started: 3, completed: 1, pending: 1, dropped: 1, matured: 2, matured_completed: 1 })
    assert.deepEqual(metrics.funnels.application_started, { started: 2, completed: 1, pending: 0, dropped: 1, matured: 2, matured_completed: 1 })
    assert.deepEqual(metrics.last_steps, { '12': 1 })
    await db.exec(`update public.engagement_limits set requests=600 where key=repeat('a',64)`)
    await assert.rejects(db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000007','visit',0,'direct','mobile',repeat('a',64))`), /engagement_rate_limited/)
  } finally { await db.close() }
})
