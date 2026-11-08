import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
const require = createRequire(import.meta.url)
function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports)
  return loadedModule.exports
}
const pagination = load('lib/request-pagination.ts')
test('page input is bounded and rejects arrays, negative, fractional and huge offsets', () => {
  for (const value of [undefined, [], ['2'], '-1', '0', '1.5', '100000', '2x', 'Infinity']) assert.equal(pagination.parseRequestPage(value), 1)
  assert.equal(pagination.parseRequestPage('2'), 2)
})
async function render({ pendingError = null, requestsError = null, page = '1', count = 0 } = {}) {
  const queries = []
  const client = { from(table) {
    const calls = []
    const query = { then(resolve) {
      const pending = calls.some(c => c[0] === 'eq' && c[1] === 'status')
      const data = table === 'facilitator_profiles' ? { verification_status: 'approved', modalities: [], display_name: 'Guide' } : []
      resolve({ data, error: table === 'booking_requests' ? pending ? pendingError : requestsError : null, count: pending ? count : null })
    } }
    for (const method of ['select', 'eq', 'in', 'order', 'range', 'limit', 'single']) query[method] = (...args) => { calls.push([method, ...args]); return query }
    queries.push({ table, calls }); return query
  } }
  const passthrough = new Proxy({}, { get: (_, key) => String(key) })
  const mocks = {
    '@/lib/request-pagination': pagination,
    '@/lib/i18n/server': { getTranslation: async () => ({ t: x => x, locale: 'en' }) },
    '@/lib/auth': { requireRole: async role => { assert.equal(role, 'facilitator'); return { id: 'owner-id', full_name: 'Guide Test' } } },
    '@/lib/supabaseServer': { createServerSupabaseClient: async () => client },
    'next/link': { default: 'a', __esModule: true },
    'lucide-react': passthrough,
  }
  for (const name of ['card', 'badge', 'button', 'separator', 'avatar']) mocks['@/components/ui/' + name] = passthrough
  const Page = load('app/(dashboard)/facilitator/page.tsx', mocks).default
  const tree = await Page({ searchParams: Promise.resolve({ pendingPage: page }) })
  // Inspect the server component tree without mounting or executing child actions.
  const json = JSON.stringify(tree, (key, value) => typeof value === 'symbol' ? String(value) : value)
  return { json, queries }
}
test('database errors render alerts, not a false empty inbox or zero pending count', async () => {
  const { json } = await render({ pendingError: { message: 'private error' }, requestsError: { message: 'private error' } })
  assert.match(json, /We could not load your new requests/)
  assert.match(json, /We could not load your accepted and past requests/)
  assert.doesNotMatch(json, /No new requests\./)
  assert.doesNotMatch(json, /private error/)
})
test('pending pagination is independently owner scoped and stable; history cannot displace it', async () => {
  const { json, queries } = await render({ page: '2', count: 81 })
  const requests = queries.filter(q => q.table === 'booking_requests')
  assert.equal(requests.length, 2)
  for (const q of requests) assert.ok(q.calls.some(c => JSON.stringify(c) === JSON.stringify(['eq', 'facilitator_id', 'owner-id'])))
  assert.ok(requests[0].calls.some(c => JSON.stringify(c) === JSON.stringify(['eq', 'status', 'pending'])))
  assert.ok(requests[0].calls.some(c => JSON.stringify(c) === JSON.stringify(['range', 40, 79])))
  assert.ok(requests[0].calls.some(c => c[0] === 'order' && c[1] === 'id'))
  assert.ok(requests[1].calls.some(c => c[0] === 'in' && !c[2].includes('pending')))
  assert.match(json, /pendingPage=3/)
  assert.match(json, /Previous page/)
  assert.doesNotMatch(json, /No new requests\./)
})
test('successful empty first page alone says no new requests', async () => {
  const { json } = await render()
  assert.match(json, /No new requests\./)
  assert.doesNotMatch(json, /We could not load/)
})
