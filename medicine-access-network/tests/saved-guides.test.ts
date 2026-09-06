import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import * as saved from '../lib/saved-guides'
import * as search from '../lib/facilitator-search'

const require = createRequire(import.meta.url)
const ids = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
]

test('saved selections accept only a bounded array of IDs, never profile snapshots or messages', () => {
  assert.deepEqual(saved.readSavedGuideIds(JSON.stringify(ids.slice(0, 3))), ids.slice(0, 3))
  for (const raw of [null, '{broken', JSON.stringify(ids), JSON.stringify([{ id: ids[0], message: 'sensitive details' }]), JSON.stringify([ids[0], 'invalid']), JSON.stringify({ ids: [ids[0]] }), 'x'.repeat(201)]) {
    assert.deepEqual(saved.readSavedGuideIds(raw), [])
  }
  assert.deepEqual(saved.readSavedGuideIds(JSON.stringify([ids[0], ids[0]])), [ids[0]])
})

test('the shortlist limit never displaces an existing choice and users can remove one before adding another', () => {
  const initial = ids.slice(0, 3)
  const rejected = saved.toggleSavedGuide(initial, ids[3])
  assert.deepEqual(rejected.ids, initial)
  assert.ok(rejected.error)
  const removed = saved.toggleSavedGuide(initial, ids[1])
  assert.deepEqual(removed.ids, [ids[0], ids[2]])
  assert.deepEqual(saved.toggleSavedGuide(removed.ids, ids[3]), { ids: [ids[0], ids[2], ids[3]] })
  assert.deepEqual(initial, ids.slice(0, 3), 'the prior selection must remain immutable')
})

test('saved-profile query rejects malformed, oversized, and injection-like values', () => {
  assert.deepEqual(saved.parseSavedGuideQuery([ids.slice(0, 3).join(',')]), ids.slice(0, 3))
  assert.deepEqual(saved.parseSavedGuideQuery([ids[0], ids[1]]), ids.slice(0, 2))
  for (const values of [[], [''], [ids.join(',')], ids, [`${ids[0]},id.not.is.null`], ['x'.repeat(10000)], [` ${ids[0]}`]]) {
    assert.equal(saved.parseSavedGuideQuery(values), null)
  }
})

function routeFixture(result: { data: unknown[] | null; error: unknown } = { data: [], error: null }) {
  const calls: unknown[] = []
  const query = {
    select(columns: string) { calls.push({ columns }); return query },
    in(column: string, values: string[]) { calls.push({ column, values }); return query },
    limit(limit: number) { calls.push({ limit }); return Promise.resolve(result) },
  }
  const source = readFileSync(new URL('../app/api/facilitators/route.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mocks: Record<string, unknown> = {
    '@/lib/saved-guides': saved,
    '@/lib/facilitator-search': { ...search, buildFacilitatorQuery(_client: unknown, filters: unknown, options: unknown) { calls.push({ filters, options }); return { data: [{ id: ids[0] }], error: null, count: 9 } } },
    '@/lib/supabaseServer': { async createServerSupabaseClient() { calls.push('client'); return { from(table: string) { calls.push({ table }); return query } } } },
  }
  const loadedModule = { exports: {} as { GET: (request: Request) => Promise<Response> } }
  new Function('require', 'module', 'exports', code)((name: string) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports)
  return { route: loadedModule.exports, calls }
}

test('invalid saved IDs cannot trigger a directory or database request', async () => {
  const { route, calls } = routeFixture()
  const response = await route.GET(new Request('https://example.test/api/facilitators?ids=private-data'))
  assert.equal(response.status, 400)
  assert.deepEqual(calls, [])
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('comparison uses only explicit public fields and requested IDs with a hard three-row bound', async () => {
  const { route, calls } = routeFixture({ data: [{ id: ids[1], display_name: 'Guide' }], error: null })
  const response = await route.GET(new Request(`https://example.test/api/facilitators?ids=${ids.slice(0, 2).join(',')}&limit=9999&q=ignored`))
  assert.equal(response.status, 200)
  assert.deepEqual(calls, ['client', { table: 'facilitator_public_profiles' }, { columns: saved.SAVED_GUIDE_COLUMNS }, { column: 'id', values: ids.slice(0, 2) }, { limit: 3 }])
  assert.doesNotMatch(saved.SAVED_GUIDE_COLUMNS, /user_id|email|verification_status|visibility|\*/)
  assert.deepEqual(await response.json(), { data: [{ id: ids[1], display_name: 'Guide' }], total: 1, limit: 2, offset: 0 })
})

test('removed profiles are an empty successful lookup, while database failure remains a retryable service error', async () => {
  const request = new Request(`https://example.test/api/facilitators?ids=${ids[0]}`)
  const empty = await routeFixture().route.GET(request)
  assert.equal(empty.status, 200)
  assert.deepEqual((await empty.json()).data, [])
  for (const result of [{ data: null, error: { message: 'Private database details' } }, { data: null, error: null }]) {
    const response = await routeFixture(result).route.GET(request)
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('retry-after'), '30')
    assert.doesNotMatch(await response.text(), /Private database details/)
  }
})

test('ordinary directory search retains its filters, pagination, count, and response contract', async () => {
  const { route, calls } = routeFixture()
  const response = await route.GET(new Request('https://example.test/api/facilitators?q=breathwork&remote=true&limit=2&offset=4'))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { data: [{ id: ids[0] }], total: 9, limit: 2, offset: 4 })
  const request = calls[1] as { filters: { q: string; remote: boolean }; options: { limit: number; offset: number } }
  assert.equal(request.filters.q, 'breathwork')
  assert.equal(request.filters.remote, true)
  assert.equal(request.options.limit, 2)
  assert.equal(request.options.offset, 4)
})
