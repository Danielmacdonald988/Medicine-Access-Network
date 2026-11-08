import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { resources } from '../lib/resources'
import { getVerifiedResourceContentDate } from '../lib/resource-content-dates'

test('only the two verified substantial resource changes have sitemap dates', () => {
  assert.deepEqual(
    Object.fromEntries(resources.flatMap(({ slug }) => {
      const date = getVerifiedResourceContentDate(slug)
      return date ? [[slug, date]] : []
    })),
    {
      'integration-basics': '2026-11-08',
      'integration-circles-vs-individual': '2026-11-08',
    },
  )
  assert.equal(getVerifiedResourceContentDate('unverified-guide'), undefined)
  assert.equal(getVerifiedResourceContentDate('constructor'), undefined)
})

test('sitemap uses verified resource dates without changing other date behavior', () => {
  const source = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
  assert.match(source, /lastModified: getVerifiedResourceContentDate\(r.slug\)/)
  assert.match(source, /lastModified: '2026-11-07'/)
  assert.match(source, /lastModified: f.created_at/)
  assert.doesNotMatch(source, /new Date\(|Date.now\(/)
})
