import assert from 'node:assert/strict'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'
import {
  addFacilitatorRatings,
  boundedInteger,
  buildFacilitatorQuery,
  directoryHref,
  filterSearchParams,
  hasActiveFilters,
  literalSearchPattern,
  parseFacilitatorFilters,
  textSearchExpression,
  toSearchParams,
} from '../lib/facilitator-search'
import type { FacilitatorSearchResult } from '../lib/types'

function clientWithFetch(fetch: typeof globalThis.fetch) {
  return createClient('https://directory.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch },
  })
}

function jsonResponse(rows: unknown[], count = rows.length) {
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Content-Range': `0-${Math.max(rows.length - 1, 0)}/${count}` },
  })
}

test('repeated URL parameters normalize safely, round-trip, and discard stale page numbers', () => {
  const filters = parseFacilitatorFilters(toSearchParams({
    q: ['  breathwork  ', 'ignored second value'],
    location: [' New\u0000 York ', 'ignored'],
    modality: ['Breathwork', 'breathwork', 'Unknown'],
    remote: 'true',
    donation: 'false',
    min_exp: '5junk',
    page: '99',
  }))
  assert.deepEqual(filters, { q: 'breathwork', location: 'New  York', modalities: ['Breathwork'], remote: true, donation: false, minExperience: 0, sort: 'newest' })
  assert.deepEqual(parseFacilitatorFilters(filterSearchParams(filters)), filters)
  assert.equal(filterSearchParams(filters).has('page'), false)
  assert.equal(directoryHref(new URLSearchParams()), '/facilitators')
})

test('pagination and experience reject malformed numbers and keep finite bounds', () => {
  for (const value of ['NaN', '-1', '1.5', '20oops', 'Infinity', '99999999999999999999999']) {
    assert.equal(boundedInteger(value, 20, 1, 100), 20)
  }
  assert.equal(boundedInteger('0', 20, 1, 100), 1)
  assert.equal(boundedInteger('1001', 20, 1, 100), 100)
  assert.equal(parseFacilitatorFilters(new URLSearchParams({ min_exp: '1001' })).minExperience, 50)
})

test('punctuation and wildcard characters search literally instead of becoming patterns', () => {
  const input = 'A.* (B), "C" \\ D % _ * [E] {F} + ^ $ | ?'
  const pattern = literalSearchPattern(input)
  assert.equal(new RegExp(pattern, 'i').test(`About ${input.toLowerCase()} here`), true)
  assert.equal(new RegExp(pattern, 'i').test('Anything B C D E F'), false)
  const expression = textSearchExpression(input)
  const firstValue = expression.slice('display_name.imatch.'.length, expression.indexOf(',bio.imatch.'))
  assert.equal(JSON.parse(firstValue), pattern)
  assert.equal(expression.includes('modalities.ov.'), false)
})

test('modality keywords participate in database text search', () => {
  const expression = textSearchExpression('integration')
  assert.match(expression, /modalities\.ov\.\{"Integration Coaching","Psychedelic Integration"\}/)
})

test('plain-language preparation and integration searches expand only to their catalog categories', () => {
  assert.match(textSearchExpression('prep'), /modalities\.ov\.\{"Preparation Coaching","Ceremony Preparation"\}/)
  assert.match(textSearchExpression('  after   a journey  '), /modalities\.ov\.\{"Integration Coaching","Psychedelic Integration"\}/)
  for (const term of ['depression', 'trauma', 'therapy', 'a name with prep in it', 'constructor', '__proto__']) {
    assert.equal(textSearchExpression(term).includes('modalities.ov.'), false, `must not infer a support need from ${term}`)
  }
})

test('sort survives search refinements and pagination resets without becoming an active filter', () => {
  const filters = parseFacilitatorFilters(new URLSearchParams({ sort: 'name', page: '4' }))
  assert.equal(filters.sort, 'name')
  assert.equal(hasActiveFilters(filters), false)
  assert.equal(filterSearchParams(filters).toString(), 'sort=name')
  const refined = { ...filters, q: 'integration', location: 'Boston', remote: true, modalities: ['Breathwork'] }
  const params = filterSearchParams(refined)
  assert.equal(params.has('page'), false)
  assert.deepEqual(parseFacilitatorFilters(params), refined)
  params.delete('modality', 'Breathwork')
  assert.equal(params.get('sort'), 'name')
  assert.equal(params.get('location'), 'Boston')
  assert.equal(params.get('remote'), 'true')
  for (const sort of ['rating', 'name.desc', 'created_at', 'name,id', 'NEWEST']) {
    assert.equal(parseFacilitatorFilters(new URLSearchParams({ sort })).sort, 'newest')
  }
})

test('alphabetical sorting happens before database pagination with a stable ID tiebreaker', async () => {
  const supabase = clientWithFetch(async (input) => {
    const params = new URL(String(input)).searchParams
    assert.equal(params.get('order'), 'display_name.asc,id.asc')
    assert.equal(params.get('offset'), '18')
    assert.equal(params.get('limit'), '18')
    assert.equal(params.get('remote_available'), 'eq.true')
    return jsonResponse([])
  })
  const filters = parseFacilitatorFilters(new URLSearchParams({ sort: 'name', remote: 'true' }))
  const result = await buildFacilitatorQuery(supabase, filters, { limit: 18, offset: 18 })
  assert.equal(result.error, null)
})

test('database search finds older matching profiles beyond the original 50-row cutoff and counts before paging', async () => {
  const profiles = Array.from({ length: 60 }, (_, index) => ({
    id: String(index),
    display_name: index >= 58 ? `Ada ${index}` : `Guide ${index}`,
    verification_status: index === 59 ? 'pending' : 'approved',
  }))
  profiles.push({ id: '60', display_name: 'Ada 60', verification_status: 'approved' })
  const supabase = clientWithFetch(async (input, options) => {
    const url = new URL(String(input))
    assert.equal(url.pathname, '/rest/v1/facilitator_public_profiles')
    assert.equal(url.searchParams.get('select'), '*')
    // The public view enforces approval and visibility and does not expose this column.
    assert.equal(url.searchParams.has('verification_status'), false)
    assert.equal(url.searchParams.get('order'), 'created_at.desc,id.desc')
    assert.ok(new Headers(options?.headers).get('Prefer')?.includes('count=exact'))
    const or = url.searchParams.get('or') ?? ''
    const match = or.match(/display_name\.imatch\.("(?:\\.|[^"\\])*")/)
    assert.ok(match, 'the database request must contain the search term')
    const pattern = new RegExp(JSON.parse(match[1]), 'i')
    const matching = profiles.filter((profile) => profile.verification_status === 'approved' && pattern.test(profile.display_name))
    const offset = Number(url.searchParams.get('offset'))
    const limit = Number(url.searchParams.get('limit'))
    return jsonResponse(matching.slice(offset, offset + limit), matching.length)
  })
  const filters = parseFacilitatorFilters(new URLSearchParams({ q: 'Ada' }))
  const first = await buildFacilitatorQuery(supabase, filters, { limit: 1, offset: 0 })
  assert.equal(first.error, null)
  assert.equal(first.count, 2)
  assert.deepEqual(first.data, [profiles[58]])
  const second = await buildFacilitatorQuery(supabase, filters, { limit: 1, offset: 1 })
  assert.equal(second.count, 2)
  assert.deepEqual(second.data, [profiles[60]])
})

test('all optional filters are sent to the database alongside the search', async () => {
  const supabase = clientWithFetch(async (input) => {
    const params = new URL(String(input)).searchParams
    assert.equal(params.get('remote_available'), 'eq.true')
    assert.equal(params.get('donation_based'), 'eq.true')
    assert.equal(params.get('years_experience'), 'gte.5')
    assert.equal(params.get('modalities'), 'ov.{Breathwork}')
    assert.equal(params.get('location'), 'imatch.New York \\(NY\\)')
    return jsonResponse([])
  })
  const filters = parseFacilitatorFilters(new URLSearchParams({ remote: 'true', donation: 'true', min_exp: '5', modality: 'Breathwork', location: 'New York (NY)' }))
  const result = await buildFacilitatorQuery(supabase, filters, { limit: 18, offset: 0 })
  assert.equal(result.error, null)
})

const profile = { id: 'profile-id', user_id: 'user-id', display_name: 'A guide' } as FacilitatorSearchResult

test('ratings follow the user foreign key and are independent of the profile query', async () => {
  const supabase = clientWithFetch(async (input) => {
    const url = new URL(String(input))
    assert.equal(url.pathname, '/rest/v1/reviews')
    assert.equal(url.searchParams.get('facilitator_id'), 'in.(user-id)')
    return jsonResponse([{ facilitator_id: 'user-id', rating: 4 }, { facilitator_id: 'user-id', rating: 5 }])
  })
  const [result] = await addFacilitatorRatings(supabase, [profile])
  assert.equal(result.id, 'profile-id')
  assert.equal(result.avg_rating, 4.5)
  assert.equal(result.review_count, 2)
})

test('a reviews outage keeps approved profiles available without invented ratings', async () => {
  const supabase = clientWithFetch(async () => new Response(JSON.stringify({ code: '42P01', message: 'unavailable' }), { status: 400 }))
  assert.deepEqual(await addFacilitatorRatings(supabase, [profile]), [profile])
})

test('a truncated reviews response never produces a misleading partial average', async () => {
  const supabase = clientWithFetch(async () => jsonResponse([{ facilitator_id: 'user-id', rating: 5 }], 1001))
  assert.deepEqual(await addFacilitatorRatings(supabase, [profile]), [profile])
})
