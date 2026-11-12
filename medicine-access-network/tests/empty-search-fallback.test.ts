import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { parseFacilitatorFilters, hasActiveFilters } from '../lib/facilitator-search'

const page = readFileSync(new URL('../app/facilitators/page.tsx', import.meta.url), 'utf8')

test('an empty filtered search offers online guides instead of a dead end', () => {
  assert.match(page, /\{active && page === 1 && <OnlineAlternatives \/>\}/)
  assert.match(page, /new URLSearchParams\(\{ remote: 'true' \}\)/)
  // The fallback uses the shared public-directory query, so it can only show
  // approved, visible profiles, and it is bounded.
  assert.match(page, /buildFacilitatorQuery\(supabase, onlineOnly, \{ limit: ONLINE_ALTERNATIVES_LIMIT, offset: 0 \}\)/)
  assert.match(page, /const ONLINE_ALTERNATIVES_LIMIT = 6/)
})

test('fallback filter is online-only and carries nothing from the failed search', () => {
  const filters = parseFacilitatorFilters(new URLSearchParams({ remote: 'true' }))
  assert.equal(filters.remote, true)
  assert.equal(filters.q, '')
  assert.equal(filters.location, '')
  assert.deepEqual(filters.modalities, [])
  assert.equal(hasActiveFilters(filters), true)
})

test('fallback copy stays honest about matching, availability and booking', () => {
  assert.match(page, /did not match your search/)
  assert.match(page, /not worldwide availability/)
  assert.match(page, /An inquiry is not a booking/)
  assert.match(page, /if \(!guides\.length\) return null/)
})
