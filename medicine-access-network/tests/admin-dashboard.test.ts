import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { change, dailySeries, parseRange, periodBounds, rate, summarize } from '../lib/admin-dashboard'

const tz = 'America/Cancun'
// 17:00 on Thu Nov 12 in Cancún (UTC-5).
const now = new Date('2026-11-12T22:00:00Z')
const ev = (session_id: string, event: string, created_at: string, source = 'direct') => ({ session_id, event, source, created_at })

test('today compares with the same time span yesterday, not a full day', () => {
  const b = periodBounds('today', now, tz)
  assert.equal(b.current.from.toISOString(), '2026-11-12T05:00:00.000Z')
  assert.equal(b.previous.from.toISOString(), '2026-11-11T05:00:00.000Z')
  assert.equal(b.previous.to.toISOString(), '2026-11-11T22:00:00.000Z')
  assert.equal(b.chartDays.length, 14)
  assert.equal(b.chartDays.at(-1)!.toISOString(), '2026-11-12T05:00:00.000Z')
})

test('7 and 30 days include today and compare with the period before', () => {
  const w = periodBounds('7d', now, tz)
  assert.equal(w.current.from.toISOString(), '2026-11-06T05:00:00.000Z')
  assert.equal(w.previous.from.toISOString(), '2026-10-30T05:00:00.000Z')
  assert.equal(w.previous.to.toISOString(), w.current.from.toISOString())
  assert.equal(periodBounds('30d', now, tz).chartDays.length, 30)
  assert.equal(parseRange('bogus'), 'today')
  assert.equal(parseRange('30d'), '30d')
})

test('funnel counts distinct sessions; reaching out is an inquiry or a messaging tap', () => {
  const w = { from: new Date('2026-11-12T05:00:00Z'), to: now }
  const s = summarize([
    ev('a', 'visit', '2026-11-12T06:00:00Z', 'instagram'), ev('a', 'visit', '2026-11-12T07:00:00Z', 'instagram'),
    ev('b', 'visit', '2026-11-12T08:00:00Z'), ev('a', 'directory_view', '2026-11-12T06:01:00Z'),
    ev('a', 'profile_view', '2026-11-12T06:02:00Z'), ev('a', 'contact_started', '2026-11-12T06:03:00Z'),
    ev('a', 'contact_sent', '2026-11-12T06:04:00Z'), ev('b', 'direct_contact', '2026-11-12T08:01:00Z'),
    ev('c', 'visit', '2026-11-11T08:00:00Z'),
  ], { requests: [{ created_at: '2026-11-12T06:04:01Z' }, { created_at: '2026-11-11T06:00:00Z' }], applications: [], accounts: [] }, w)
  assert.deepEqual(s.funnel.map(f => f.value), [2, 1, 1, 1, 2])
  assert.deepEqual(s.sources, [['instagram', 1], ['direct', 1]])
  assert.equal(s.inquiries, 1)
  assert.equal(s.sessions.contact_sent, 1)
})

test('daily series buckets by local day and helpers format plainly', () => {
  const days = periodBounds('today', now, tz).chartDays.slice(-2)
  const series = dailySeries([ev('a', 'visit', '2026-11-12T04:59:00Z'), ev('b', 'visit', '2026-11-12T05:01:00Z')], [{ created_at: '2026-11-12T06:00:00Z' }], days, now)
  assert.deepEqual(series.map(d => [d.visitors, d.inquiries]), [[1, 0], [1, 1]])
  assert.equal(change(0, 0), null)
  assert.equal(change(5, 34)?.text, '−29')
  assert.equal(rate(1, 3), '33%')
  assert.equal(rate(1, 0), '–')
})

test('the admin page leads with the dashboard and keeps the full report and review queue', () => {
  const page = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8')
  const dash = page.indexOf('<AdminDashboard range={parseRange(params.range)} />')
  assert.ok(dash > 0 && dash < page.indexOf('id="pending-applications"') && page.indexOf('id="pending-applications"') < page.indexOf('<EngagementMetrics'))
  const panel = readFileSync(new URL('../components/admin/AdminDashboard.tsx', import.meta.url), 'utf8')
  assert.match(panel, /await requireRole\('admin'\)/)
  assert.doesNotMatch(panel, /select\('[^']*(email|message|seeker_|display_name|bio)/)
})
