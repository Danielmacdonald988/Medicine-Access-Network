import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)

function loadModule(path, mocks = {}) {
  const source = readFileSync(new URL(path, root), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', '__dirname', code)((name) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports, root.pathname)
  return loadedModule.exports
}

const schemas = loadModule('lib/validations.ts', {
  './direct-contact': loadModule('lib/direct-contact.ts'),
  './profile-media': loadModule('lib/profile-media.ts'),
})
const bodyHelpers = loadModule('lib/request-body.ts')

function fixture({ admin = true, updateFails = false, noteFails = false } = {}) {
  const writes = []
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-id' } } }) },
    from(table) {
      let update
      const query = {
        select() { return query },
        eq() { return query },
        single: async () => ({ data: { role: admin ? 'admin' : 'facilitator' } }),
        maybeSingle: async () => update
          ? { data: updateFails ? null : { id: 'profile-id' }, error: updateFails ? { message: 'offline' } : null }
          : { data: { user_id: 'guide-user-id' }, error: null },
        update(value) { update = value; writes.push({ table, value }); return query },
        insert: async (value) => { writes.push({ table, value }); return { error: noteFails ? { message: 'offline' } : null } },
      }
      return query
    },
  }
  const routes = loadModule('app/api/admin/facilitators/[id]/route.ts', {
    '@/lib/supabaseServer': { createServerSupabaseClient: async () => supabase },
    '@/lib/validations': schemas,
    '@/lib/request-body': bodyHelpers,
  })
  return { writes, routes }
}

const context = () => ({ params: Promise.resolve({ id: 'profile-id' }) })
function request(status, note, headers = {}) {
  return new Request('https://directory.test/api/admin/facilitators/profile-id', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ status, note }),
  })
}

test('admin approval publishes and other review decisions hide the profile in the same update', async () => {
  for (const status of ['approved', 'pending', 'rejected']) {
    const { writes, routes } = fixture()
    const response = await routes.PATCH(request(status), context())
    assert.equal(response.status, 200)
    assert.deepEqual(writes, [{ table: 'facilitator_profiles', value: { verification_status: status, visibility: status === 'approved' ? 'public' : 'hidden' } }])
  }
})

test('a non-admin cannot change publication or add review notes', async () => {
  const { writes, routes } = fixture({ admin: false })
  assert.equal((await routes.PATCH(request('approved', 'A note'), context())).status, 403)
  assert.deepEqual(writes, [])
})

test('a failed publication update never records a successful review note', async () => {
  const { writes, routes } = fixture({ updateFails: true })
  const response = await routes.PATCH(request('approved', 'A note'), context())
  assert.equal(response.status, 500)
  assert.equal(writes.some((write) => write.table === 'verification_notes'), false)
})

test('HTML review form reports publication or note failure after redirecting to admin', async () => {
  for (const noteFails of [false, true]) {
    const { routes } = fixture({ noteFails })
    const form = new FormData()
    form.set('status', 'approved')
    form.set('note', 'A review note')
    const response = await routes.POST(new Request('https://directory.test/api/admin/facilitators/profile-id', { method: 'POST', body: form }), context())
    assert.equal(response.status, 303)
    assert.equal(new URL(response.headers.get('Location')).searchParams.get('notice'), noteFails ? 'note_failed' : 'published')
  }
})

test('cross-site JSON and HTML approval requests cannot change publication or add notes', async () => {
  for (const method of ['PATCH', 'POST']) {
    for (const headers of [{ Origin: 'null' }, { Origin: 'https://unrelated.test' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      const { writes, routes } = fixture()
      const incoming = method === 'PATCH'
        ? request('approved', 'A review note', headers)
        : new Request('https://directory.test/api/admin/facilitators/profile-id', {
          method: 'POST', headers, body: new URLSearchParams({ status: 'approved', note: 'A review note' }),
        })
      assert.equal((await routes[method](incoming, context())).status, 403)
      assert.deepEqual(writes, [])
    }
  }
})

test('private pages preserve same-origin form identity without sending referrers to other sites', async () => {
  const config = loadModule('next.config.ts', { './lib/env': { validateEnv() {} } }).default
  const rules = await config.headers()
  for (const route of ['admin', 'facilitator', 'dashboard', 'onboarding', 'login']) {
    const rule = rules.find(({ source }) => source === `/${route}/:path*`)
    assert.ok(rule, `Missing private headers for ${route}`)
    const headers = new Headers(rule.headers.map(({ key, value }) => [key, value]))
    // no-referrer makes native POST forms send Origin:null, which the strict
    // origin check correctly rejects. same-origin preserves local form posts.
    assert.equal(headers.get('Referrer-Policy'), 'same-origin')
    assert.match(headers.get('Cache-Control'), /private, no-store/)
    assert.equal(headers.get('X-Robots-Tag'), 'noindex, nofollow')
  }
})

test('native same-origin approval and rejection forms work with empty or populated notes', async () => {
  for (const status of ['approved', 'rejected']) {
    for (const note of ['', '  Reviewed application  ']) {
      const { routes, writes } = fixture()
      const response = await routes.POST(new Request('https://directory.test/api/admin/facilitators/profile-id', {
        method: 'POST',
        headers: { Origin: 'https://directory.test', 'Sec-Fetch-Site': 'same-origin' },
        body: new URLSearchParams({ note, status }),
      }), context())
      assert.equal(response.status, 303)
      assert.equal(new URL(response.headers.get('Location')).searchParams.get('notice'), status === 'approved' ? 'published' : 'hidden')
      assert.deepEqual(writes[0].value, { verification_status: status, visibility: status === 'approved' ? 'public' : 'hidden' })
      assert.equal(writes.length, note ? 2 : 1)
      if (note) assert.equal(writes[1].value.note, note.trim())
    }
  }
})

test('a form without an explicit review decision never publishes a profile', async () => {
  const { routes, writes } = fixture()
  const response = await routes.POST(new Request('https://directory.test/api/admin/facilitators/profile-id', {
    method: 'POST', headers: { Origin: 'https://directory.test' }, body: new URLSearchParams({ note: '' }),
  }), context())
  assert.equal(new URL(response.headers.get('Location')).searchParams.get('notice'), 'invalid')
  assert.deepEqual(writes, [])
})

test('oversized approval bodies are rejected before any publication or note writes', async () => {
  for (const method of ['PATCH', 'POST']) {
    const { writes, routes } = fixture()
    const incoming = method === 'PATCH'
      ? request('approved', 'x'.repeat(16_384))
      : new Request('https://directory.test/api/admin/facilitators/profile-id', {
        method: 'POST', body: new URLSearchParams({ status: 'approved', note: 'x'.repeat(16_384) }),
      })
    assert.equal((await routes[method](incoming, context())).status, 413)
    assert.deepEqual(writes, [])
  }
})
