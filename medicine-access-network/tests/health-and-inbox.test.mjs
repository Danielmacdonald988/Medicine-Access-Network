import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)

function loadModule(path, mocks = {}) {
  const source = readFileSync(new URL(path, root), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(
    (name) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports,
  )
  return loadedModule.exports
}

const requiredEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test-key',
  SUPABASE_SERVICE_ROLE_KEY: 'private-test-key',
}

function configureEnvironment(t) {
  for (const [key, value] of Object.entries(requiredEnvironment)) {
    const previous = process.env[key]
    process.env[key] = value
    t.after(() => {
      if (previous === undefined) delete process.env[key]
      else process.env[key] = previous
    })
  }
}

function healthFixture(options = {}) {
  const calls = []
  let signal
  const route = loadModule('app/api/health/route.ts', {
    '@supabase/supabase-js': {
      createClient(url, key, clientOptions) {
        calls.push({ url, key, clientOptions })
        const query = {
          select(columns, selectOptions) { calls.push({ columns, selectOptions }); return query },
          limit(limit) { calls.push({ limit }); return query },
          abortSignal(value) { signal = value; return query },
          then(resolve, reject) {
            if (options.hangs) return new Promise(() => {})
            if (options.rejects) return Promise.reject(new Error('Private diagnostics')).then(resolve, reject)
            return Promise.resolve(options.result ?? { data: null, error: null }).then(resolve, reject)
          },
        }
        return {
          from(table) { calls.push({ table }); return query },
        }
      },
    },
  })
  return { route, calls, getSignal: () => signal }
}

test('health uses a cookie-free anonymous HEAD query and accepts an empty directory', async (t) => {
  configureEnvironment(t)
  const { route, calls, getSignal } = healthFixture()
  const response = await route.GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { status: 'ok' })
  assert.deepEqual(calls, [
    {
      url: requiredEnvironment.NEXT_PUBLIC_SUPABASE_URL,
      key: requiredEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      clientOptions: { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
    },
    { table: 'facilitator_public_profiles' },
    { columns: 'id', selectOptions: { head: true } },
    { limit: 1 },
  ])
  assert.equal(getSignal() instanceof AbortSignal, true)
  assert.equal(JSON.stringify(calls).includes(requiredEnvironment.SUPABASE_SERVICE_ROLE_KEY), false)
})

test('health fails closed for each missing required setting without reaching the database', async (t) => {
  configureEnvironment(t)
  for (const [key, value] of Object.entries(requiredEnvironment)) {
    process.env[key] = ' '
    const { route, calls } = healthFixture()
    const response = await route.GET()
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), { status: 'unavailable' })
    assert.deepEqual(calls, [])
    process.env[key] = value
  }
})

test('health does not expose database diagnostics on rejected or failed queries', async (t) => {
  configureEnvironment(t)
  for (const options of [
    { rejects: true },
    { result: { data: null, error: { message: 'Private diagnostics', details: 'secret', code: 'XX000' } } },
  ]) {
    const response = await healthFixture(options).route.GET()
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  }
})

test('health aborts after four seconds and returns503 even if the database client never settles', async (t) => {
  configureEnvironment(t)
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { route, getSignal } = healthFixture({ hangs: true })
  let settled = false
  const pending = route.GET().then((response) => { settled = true; return response })
  t.mock.timers.tick(3_999)
  await Promise.resolve()
  assert.equal(settled, false)
  assert.equal(getSignal().aborted, false)
  t.mock.timers.tick(1)
  const response = await pending
  assert.equal(response.status, 503)
  assert.equal(getSignal().aborted, true)
  assert.deepEqual(await response.json(), { status: 'unavailable' })
})

function inboxFixture({ signedIn = true, throws = false, result = { data: [], error: null } } = {}) {
  const queries = []
  const route = loadModule('app/api/booking-requests/route.ts', {
    '@/lib/supabaseServer': {
      createServerSupabaseClient: async () => {
        if (throws) throw new Error('private-person@example.com')
        return {
          auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'guide-user-id' } : null } }) },
          from(table) {
            queries.push({ table })
            const query = {
              select(columns) { queries.push({ columns }); return query },
              or(filter) { queries.push({ filter }); return query },
              order: async () => result,
            }
            return query
          },
        }
      },
    },
  })
  return { route, queries }
}

test('inbox keeps its authentication/ownership filters and prevents response caching', async () => {
  const { route, queries } = inboxFixture()
  const response = await route.GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), [])
  assert.deepEqual(queries, [
    { table: 'booking_requests' }, { columns: '*' },
    { filter: 'seeker_id.eq.guide-user-id,facilitator_id.eq.guide-user-id' },
  ])
  const anonymous = inboxFixture({ signedIn: false })
  assert.equal((await anonymous.route.GET()).status, 401)
  assert.deepEqual(anonymous.queries, [])
})

test('inbox service and query errors expose no personal diagnostics in responses or logs', async (t) => {
  const errors = t.mock.method(console, 'error', () => {})
  for (const options of [
    { throws: true },
    { result: { data: null, error: { code: 'XX000', message: 'private-person@example.com' } } },
  ]) {
    const response = await inboxFixture(options).route.GET()
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal((await response.text()).includes('private-person@example.com'), false)
  }
  assert.equal(JSON.stringify(errors.mock.calls).includes('private-person@example.com'), false)
})
