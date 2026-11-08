import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { pageEvent, trafficSource } from '../lib/engagement'

test('coarse page signals and referral classification never include sensitive values', () => {
  assert.equal(pageEvent('/'), 'directory_view')
  assert.equal(pageEvent('/integration-support'), 'directory_view')
  assert.equal(pageEvent('/facilitators'), 'directory_view')
  assert.equal(pageEvent('/facilitators/private-id'), 'profile_view')
  assert.equal(pageEvent('/resources'), 'resource_view')
  assert.equal(pageEvent('/psychedelic-facilitator'), 'resource_view')
  assert.equal(pageEvent('/auth/callback'), null)
  assert.equal(pageEvent('/admin'), null)
  assert.equal(trafficSource('https://l.instagram.com/?private=secret', 'thefacilitatornetwork.com'), 'instagram')
  assert.equal(trafficSource('https://instagram.com.attacker.example/', 'thefacilitatornetwork.com'), 'other')
  assert.equal(trafficSource('https://www.thefacilitatornetwork.com/signup', 'thefacilitatornetwork.com'), 'direct')
  assert.equal(trafficSource('', 'thefacilitatornetwork.com'), 'direct')
})

test('social referral buckets are hostname bounded and ignore paths and campaign text', () => {
  const cases = [
    ['https://www.tiktok.com/@example/video/1?utm_source=private', 'tiktok'],
    ['https://vm.tiktok.com/opaque/', 'tiktok'],
    ['https://x.com/example/status/1', 'x'],
    ['https://mobile.twitter.com/example', 'x'],
    ['https://t.co/opaque', 'x'],
    ['https://m.youtube.com/watch?v=opaque', 'youtube'],
    ['https://youtu.be/opaque', 'youtube'],
  ]
  for (const [url, expected] of cases) assert.equal(trafficSource(url, 'thefacilitatornetwork.com'), expected)
  for (const url of ['https://tiktok.com.attacker.example/', 'https://notx.com/', 'https://fake-youtube.com/', 'https://evil.example/?utm_source=tiktok', 'https://evil.example/x.com', 'https://evil.example/youtu.be']) {
    assert.equal(trafficSource(url, 'thefacilitatornetwork.com'), 'other')
  }
})

test('engagement database protects events and correctly separates matured drop-offs from pending attempts', async () => {
  const db = new PGlite()
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role;')
    const migration = await readFile(new URL('../db/migrations/0007_engagement.sql', import.meta.url), 'utf8')
    await db.exec(migration)
    await db.exec(migration) // repeatable deployment
    const seekerMigration = await readFile(new URL('../db/migrations/20261107234426_seeker_contact_funnel.sql', import.meta.url), 'utf8')
    await db.exec(seekerMigration)
    await db.exec(seekerMigration) // repeatable deployment
    const sourceMigration = await readFile(new URL('../db/migrations/20261108005340_source_contact_funnels.sql', import.meta.url), 'utf8')
    await db.exec(sourceMigration)
    await db.exec(sourceMigration)
    const socialMigration = await readFile(new URL('../db/migrations/20261108145515_coarse_social_referral_sources.sql', import.meta.url), 'utf8')
    await db.exec("insert into public.engagement_events(session_id,event,step,source,device) values ('40000000-0000-4000-8000-000000000001','visit',0,'other','mobile')")
    await db.exec(socialMigration)
    await db.exec(socialMigration)
    assert.equal((await db.query<{ source: string }>("select source from public.engagement_events where session_id='40000000-0000-4000-8000-000000000001'")).rows[0].source, 'other')
    await db.exec("delete from public.engagement_events where session_id='40000000-0000-4000-8000-000000000001'")
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
      ('10000000-0000-4000-8000-000000000011','contact_started',0,'search','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000011','contact_sent',0,'search','mobile',now()-interval '47 hours'),
      ('10000000-0000-4000-8000-000000000012','contact_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000012','direct_contact',0,'direct','mobile',now()-interval '47 hours'),
      ('10000000-0000-4000-8000-000000000013','contact_started',0,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000014','contact_started',0,'direct','mobile',now()-interval '2 days'),
      ('10000000-0000-4000-8000-000000000014','contact_sent',0,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000015','contact_started',0,'direct','mobile',now()-interval '1 hour'),
      ('10000000-0000-4000-8000-000000000015','contact_sent',0,'direct','mobile',now()-interval '2 hours'),
      ('10000000-0000-4000-8000-000000000006','signup_started',0,'direct','mobile',now()-interval '40 days');
    `)
    const result = await db.query<{ value: { counts: Record<string,number>; funnels: Record<string,Record<string,number>>; last_steps: Record<string,number> } }>('select public.engagement_summary(30) as value')
    const metrics = result.rows[0].value
    assert.equal(metrics.counts.visit, 1)
    assert.deepEqual(metrics.funnels.signup_started, { started: 3, completed: 1, pending: 1, dropped: 1, matured: 2, matured_completed: 1 })
    assert.deepEqual(metrics.funnels.application_started, { started: 2, completed: 1, pending: 0, dropped: 1, matured: 2, matured_completed: 1 })
    assert.deepEqual(metrics.funnels.contact_started, { started: 5, completed: 1, pending: 2, dropped: 2, matured: 3, matured_completed: 1 })
    assert.deepEqual(metrics.last_steps, { '12': 1 })
    type SourceSummary = { source_contact_funnels: Record<string, Record<string, number>>; excluded_source_sessions: number }
    const firstSource = (await db.query<{ value: SourceSummary }>('select public.engagement_summary(30) as value')).rows[0].value
    assert.deepEqual(firstSource.source_contact_funnels.search, { started: 1, completed: 1, pending: 0, dropped: 0, matured: 1, matured_completed: 1 })
    assert.deepEqual(firstSource.source_contact_funnels.direct, { started: 4, completed: 0, pending: 2, dropped: 2, matured: 2, matured_completed: 0 })
    assert.equal(firstSource.excluded_source_sessions, 0)
    // No visit is required; retain all five coarse sources. No request rows joined.
    await db.exec(`begin;
      insert into public.engagement_events(session_id,event,step,source,device,created_at) values
      ('20000000-0000-4000-8000-000000000001','contact_started',0,'instagram','mobile',now()-interval '24 hours'),
      ('20000000-0000-4000-8000-000000000001','contact_sent',0,'instagram','mobile',now()),
      ('20000000-0000-4000-8000-000000000002','contact_started',0,'linktree','mobile',now()-interval '1 hour'),
      ('20000000-0000-4000-8000-000000000003','contact_started',0,'other','mobile',now()-interval '2 days'),
      ('20000000-0000-4000-8000-000000000004','contact_started',0,'instagram','mobile',now()-interval '2 days'),
      ('20000000-0000-4000-8000-000000000004','contact_sent',0,'search','mobile',now()-interval '47 hours'),
      ('20000000-0000-4000-8000-000000000005','contact_started',0,'instagram','mobile',now()-interval '40 days');`)
    const bySource = (await db.query<{ value: SourceSummary }>('select public.engagement_summary(30) as value')).rows[0].value
    assert.deepEqual(bySource.source_contact_funnels.instagram, { started: 1, completed: 1, pending: 0, dropped: 0, matured: 1, matured_completed: 1 })
    assert.equal(bySource.source_contact_funnels.linktree.pending, 1)
    assert.equal(bySource.source_contact_funnels.other.dropped, 1)
    assert.equal(bySource.excluded_source_sessions, 1)
    assert.equal(Object.keys(bySource.source_contact_funnels).length, 5)
    assert.doesNotMatch(JSON.stringify(bySource.source_contact_funnels), /session_id|20000000|request_id/)
    const invalidWindow = (await db.query<{ value: SourceSummary }>('select public.engagement_summary(5) as value')).rows[0].value
    assert.deepEqual(invalidWindow.source_contact_funnels, bySource.source_contact_funnels)
    await db.exec("delete from public.engagement_events where session_id <> '20000000-0000-4000-8000-000000000004'")
    const excludedOnly = (await db.query<{ value: SourceSummary }>('select public.engagement_summary(30) as value')).rows[0].value
    assert.deepEqual(excludedOnly.source_contact_funnels, {})
    assert.equal(excludedOnly.excluded_source_sessions, 1)
    await db.exec('rollback')
    // New buckets reach the same aggregate funnel without joining inquiry records.
    for (const [index, source] of ['tiktok', 'x', 'youtube'].entries()) {
      const id = `30000000-0000-4000-8000-00000000000${index}`
      await db.query(`select public.record_engagement($1,'contact_started',0,$2,'mobile',repeat('b',64))`, [id, source])
      await db.query(`select public.record_engagement($1,'contact_sent',0,$2,'mobile',repeat('b',64))`, [id, source])
    }
    const social = (await db.query<{ value: SourceSummary }>('select public.engagement_summary(30) as value')).rows[0].value
    for (const source of ['tiktok', 'x', 'youtube']) {
      assert.equal(social.source_contact_funnels[source].started, 1)
      assert.equal(social.source_contact_funnels[source].completed, 1)
    }
    await assert.rejects(db.query(`select public.record_engagement('30000000-0000-4000-8000-000000000009','visit',0,'private-campaign','mobile',repeat('b',64))`), /check constraint/)
    await db.exec(`update public.engagement_limits set requests=600 where key=repeat('a',64)`)
    await assert.rejects(db.query(`select public.record_engagement('10000000-0000-4000-8000-000000000007','visit',0,'direct','mobile',repeat('a',64))`), /engagement_rate_limited/)
  } finally { await db.close() }
})


test('admin separates count-only stored requests from browser signals and documents measurement limits', async () => {
  const source = await readFile(new URL('../components/admin/EngagementMetrics.tsx', import.meta.url), 'utf8')
  assert.ok(source.indexOf("await requireRole('admin')") < source.indexOf(".from('booking_requests')"))
  assert.match(source, /select\('id', \{ count: 'exact', head: true \}\)/)
  assert.match(source, /\.gte\('created_at', since\)/)
  assert.match(source, /storedRequests === null \? 'Unavailable' : storedRequests/)
  assert.match(source, /Resource viewers/)
  assert.doesNotMatch(source, /Resource readers/)
  assert.match(source, /not confirmed reading/)
  assert.match(source, /expires 24 hours after its first tracked activity/)
  assert.match(source, /not campaign attribution/)
  assert.match(source, /does not confirm notification delivery/)
})

 test('source breakdown remains private and distinguishable from unavailable data', async () => {
  const component = await readFile(new URL('../components/admin/EngagementMetrics.tsx', import.meta.url), 'utf8')
  assert.match(component, /source_contact_funnels === undefined/)
  assert.match(component, /Source breakdown is not yet available/)
  assert.match(component, /No attributable contact starts/)
  assert.match(component, /Small sample/)
  assert.match(component, /not a verified stored inquiry/)
  const sql = await readFile(new URL('../db/migrations/20261108005340_source_contact_funnels.sql', import.meta.url), 'utf8')
  assert.doesNotMatch(sql, /booking_requests|seeker_email|utm_|campaign_id/)
})
