import assert from 'node:assert/strict'
import test from 'node:test'
import { countDay, countSince, startOfLocalDay } from '../lib/today-activity'

test('today starts at local midnight in the operator time zone', () => {
  // 21:53 on Nov 11 in Cancún (UTC-5) is 02:53 UTC on Nov 12.
  const now = new Date('2026-11-12T02:53:00Z')
  assert.equal(startOfLocalDay(now, 'America/Cancun').toISOString(), '2026-11-11T05:00:00.000Z')
  // Just after local midnight belongs to the new day.
  assert.equal(startOfLocalDay(new Date('2026-11-12T05:00:30Z'), 'America/Cancun').toISOString(), '2026-11-12T05:00:00.000Z')
  // Zones with daylight saving use the offset in force that day.
  assert.equal(startOfLocalDay(new Date('2026-07-01T12:00:00Z'), 'America/New_York').toISOString(), '2026-07-01T04:00:00.000Z')
  assert.equal(startOfLocalDay(new Date('2026-12-01T12:00:00Z'), 'America/New_York').toISOString(), '2026-12-01T05:00:00.000Z')
})

test('counts distinct sessions per event within the window, and visit sources', () => {
  const from = new Date('2026-11-11T05:00:00Z'), to = new Date('2026-11-12T05:00:00Z')
  const ev = (session_id: string, event: string, created_at: string, source = 'direct') => ({ session_id, event, source, created_at })
  const counts = countDay([
    ev('a', 'visit', '2026-11-11T06:00:00Z', 'instagram'),
    ev('a', 'visit', '2026-11-11T07:00:00Z', 'instagram'),
    ev('b', 'visit', '2026-11-11T08:00:00Z', 'search'),
    ev('a', 'profile_view', '2026-11-11T06:05:00Z'),
    ev('c', 'visit', '2026-11-11T04:59:59Z'),
    ev('d', 'visit', '2026-11-12T05:00:00Z'),
  ], from, to)
  assert.deepEqual(counts.sessions, { visit: 2, profile_view: 1 })
  assert.deepEqual(counts.sources, { instagram: 1, search: 1 })
  assert.equal(countSince([{ created_at: '2026-11-11T05:00:00Z' }, { created_at: '2026-11-12T05:00:00Z' }], from, to), 1)
})

