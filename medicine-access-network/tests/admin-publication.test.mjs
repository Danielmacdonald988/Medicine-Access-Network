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
  new Function('require', 'module', 'exports', code)((name) => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports)
  return loadedModule.exports
}

const schemas = loadModule('lib/validations.ts')

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
  })
  return { writes, routes }
}

const context = () => ({ params: Promise.resolve({ id: 'profile-id' }) })
function request(status, note) {
  return new Request('https://directory.test/api/admin/facilitators/profile-id', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, note }),
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
