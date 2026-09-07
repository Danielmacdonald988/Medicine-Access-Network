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

const media = loadModule('lib/profile-media.ts')
const schemas = loadModule('lib/validations.ts', {
  './direct-contact': loadModule('lib/direct-contact.ts'),
  './profile-media': media,
})
const bodyHelpers = loadModule('lib/request-body.ts')
const userId = '7770dcec-3b69-405b-8ee9-f9df0f86817d'
const profileId = 'efc3f285-a16a-42be-86ee-9f75e0e209df'
const otherUserId = '55555555-5555-4555-8555-555555555555'
const photoPath = `${userId}/11111111-1111-4111-8111-111111111111.webp`

const application = (overrides = {}) => ({
  display_name: 'A guide',
  bio: 'A detailed description of my preparation and integration practice. '.repeat(3),
  location: '',
  modalities: ['integration-coaching'],
  certifications: ' Training one, , Training two ',
  safety_practices: 'I use appropriate screening, informed consent, clear boundaries, and an emergency plan.',
  contraindications_acknowledged: true,
  image_paths: [photoPath],
  whatsapp_url: null,
  signal_url: null,
  telegram_url: null,
  platform_agreement: true,
  ...overrides,
})

function fixture({ authenticated = true, role = 'facilitator', authError = null,
  accountError = null, saveError = null, saved = true, dispatchThrows = false,
  dispatchResult = { sent: 1, failed: 0, configured: true } } = {}) {
  const writes = []
  const reads = []
  const afterCallbacks = []
  const dispatchCalls = []
  const supabase = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: userId } : null }, error: authError }) },
    from(table) {
      const filters = []
      let write
      const query = {
        select(fields) { reads.push({ table, fields }); return query },
        eq(field, value) { filters.push([field, value]); return query },
        insert(value) { write = { table, method: 'insert', value, filters }; writes.push(write); return query },
        update(value) { write = { table, method: 'update', value, filters }; writes.push(write); return query },
        single: async () => table === 'users'
          ? { data: { role }, error: accountError }
          : { data: saved && !saveError ? { id: profileId } : null, error: saveError },
      }
      return query
    },
  }
  const mocks = {
    'next/server': {
      ...require('next/server'),
      after: (callback) => { afterCallbacks.push(callback) },
    },
    '@/lib/supabaseServer': { createServerSupabaseClient: async () => supabase },
    '@/lib/validations': schemas,
    '@/lib/profile-media': media,
    '@/lib/request-body': bodyHelpers,
    '@/lib/admin-notifications': {
      dispatchAdminApplicationNotifications: async (options) => {
        dispatchCalls.push(options)
        if (dispatchThrows) throw new Error('Provider unavailable')
        return dispatchResult
      },
    },
  }
  return {
    writes, reads, afterCallbacks, dispatchCalls,
    applications: loadModule('app/api/facilitator-applications/route.ts', mocks),
    notifications: loadModule('app/api/admin/notifications/route.ts', mocks),
  }
}

function submission({ profileId: editingId, application: fields = application(), headers = {}, body } = {}) {
  return new Request('https://directory.test/api/facilitator-applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: body ?? JSON.stringify({ profileId: editingId, application: fields }),
  })
}

function retry({ headers = {}, body = new URLSearchParams({ action: 'retry' }) } = {}) {
  return new Request('https://directory.test/api/admin/notifications', { method: 'POST', headers, body })
}

test('new applications derive ownership from authentication and save only pending hidden profiles', async () => {
  const f = fixture()
  const response = await f.applications.POST(submission({
    application: application({ user_id: otherUserId, verification_status: 'approved', visibility: 'public', role: 'admin' }),
  }))
  assert.equal(response.status, 201)
  assert.match(response.headers.get('Cache-Control'), /no-store/)
  assert.deepEqual(await response.json(), { success: true, profileId })
  assert.equal(f.writes.length, 1)
  const write = f.writes[0]
  assert.equal(write.method, 'insert')
  assert.equal(write.value.user_id, userId)
  assert.equal(write.value.verification_status, 'pending')
  assert.equal(write.value.visibility, 'hidden')
  assert.deepEqual(write.value.certifications, ['Training one', 'Training two'])
  assert.equal(write.value.hourly_rate, null)
  assert.equal(write.value.minimum_donation, null)
  assert.equal(write.value.years_experience, null)
  assert.equal(write.value.location, null)
  assert.equal(write.value.role, undefined)
  assert.equal(write.value.platform_agreement, undefined)
  assert.equal(f.afterCallbacks.length, 1)
  assert.deepEqual(f.dispatchCalls, [])
  await f.afterCallbacks[0]()
  assert.deepEqual(f.dispatchCalls, [{ profileId }])
})

test('edits require an explicit profile ID and are filtered by both ID and authenticated owner', async () => {
  const f = fixture()
  const response = await f.applications.POST(submission({ profileId, application: application({ hourly_rate: 0 }) }))
  assert.equal(response.status, 200)
  assert.equal(f.writes[0].method, 'update')
  assert.deepEqual(f.writes[0].filters, [['id', profileId], ['user_id', userId]])
  assert.equal(f.writes[0].value.hourly_rate, 0)
  assert.equal(f.writes[0].value.visibility, 'hidden')
})

test('unauthenticated, wrong-role, and unavailable-account requests cannot save or schedule alerts', async () => {
  for (const [options, status] of [
    [{ authenticated: false }, 401],
    [{ authError: { message: 'expired' } }, 401],
    [{ role: 'admin' }, 403],
    [{ role: 'seeker' }, 403],
    [{ accountError: { message: 'offline' } }, 503],
  ]) {
    const f = fixture(options)
    assert.equal((await f.applications.POST(submission())).status, status)
    assert.deepEqual(f.writes, [])
    assert.deepEqual(f.afterCallbacks, [])
  }
})

test('cross-site application requests and oversized actual bodies never write or schedule alerts', async () => {
  for (const options of [
    { headers: { Origin: 'https://unrelated.test' } },
    { headers: { 'Sec-Fetch-Site': 'cross-site' } },
    { body: ' '.repeat(16_385), headers: { 'Content-Length': '1' } },
    { body: ' '.repeat(16_385) },
  ]) {
    const f = fixture()
    const response = await f.applications.POST(submission(options))
    assert.equal(response.status, options.body ? 413 : 403)
    assert.deepEqual(f.writes, [])
    assert.deepEqual(f.afterCallbacks, [])
  }
})

test('application schema and photo ownership are enforced server-side before writing', async () => {
  for (const fields of [
    application({ image_paths: [] }),
    application({ image_paths: [photoPath, photoPath] }),
    application({ image_paths: [photoPath.replace(userId, otherUserId)] }),
    application({ image_paths: ['https://untrusted.test/image.webp'] }),
    application({ platform_agreement: false }),
    application({ bio: 'Too short' }),
    application({ whatsapp_url: 'https://wa.me.evil.test/14155552671' }),
  ]) {
    const f = fixture()
    assert.equal((await f.applications.POST(submission({ application: fields }))).status, 400)
    assert.deepEqual(f.writes, [])
    assert.deepEqual(f.afterCallbacks, [])
  }
  const f = fixture()
  assert.equal((await f.applications.POST(submission({ profileId: 'not-a-uuid' }))).status, 400)
  assert.deepEqual(f.writes, [])
})

test('duplicate applications, database photo rejection, and invisible edits never report success or notify', async () => {
  for (const [options, status] of [
    [{ saveError: { code: '23505', message: 'Private database detail' } }, 409],
    [{ saveError: { code: '23514', message: 'Photo is not stored' } }, 400],
    [{ saved: false }, 500],
  ]) {
    const f = fixture(options)
    const response = await f.applications.POST(submission({ profileId: options.saved === false ? profileId : undefined }))
    assert.equal(response.status, status)
    const body = await response.json()
    assert.equal(body.success, undefined)
    assert.doesNotMatch(body.error, /Private database detail|Photo is not stored/)
    assert.deepEqual(f.afterCallbacks, [])
  }
})

test('an email outage cannot undo or turn a saved application into an error', async () => {
  for (const options of [
    { dispatchThrows: true },
    { dispatchResult: { sent: 0, failed: 1, configured: true } },
    { dispatchResult: { sent: 0, failed: 0, configured: false } },
  ]) {
    const f = fixture(options)
    const response = await f.applications.POST(submission())
    assert.equal(response.status, 201)
    assert.deepEqual(await response.json(), { success: true, profileId })
    await assert.doesNotReject(f.afterCallbacks[0]())
    assert.equal(f.writes.length, 1)
  }
})

test('only authenticated admins can retry queued alerts, including through ordinary HTML forms', async () => {
  for (const [options, status] of [
    [{ authenticated: false }, 401],
    [{ role: 'facilitator' }, 403],
    [{ role: 'seeker' }, 403],
    [{ role: 'admin', accountError: { message: 'offline' } }, 403],
  ]) {
    const f = fixture(options)
    assert.equal((await f.notifications.POST(retry())).status, status)
    assert.deepEqual(f.dispatchCalls, [])
  }
  const f = fixture({ role: 'admin' })
  const response = await f.notifications.POST(retry())
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('Location'), 'https://directory.test/admin?notice=notifications_sent')
  assert.match(response.headers.get('Cache-Control'), /no-store/)
  assert.deepEqual(f.dispatchCalls, [undefined])
})

test('cross-origin, oversized, and recipient-injection retry requests cannot dispatch mail', async () => {
  for (const [options, status] of [
    [{ headers: { Origin: 'https://unrelated.test' } }, 403],
    [{ headers: { 'Sec-Fetch-Site': 'cross-site' } }, 403],
    [{ body: new URLSearchParams({ action: 'retry', extra: 'x'.repeat(16_385) }), headers: { 'Content-Length': '1' } }, 413],
    [{ body: new URLSearchParams({ action: 'retry', to: 'someone@unrelated.test' }) }, 400],
    [{ body: JSON.stringify({ action: 'retry', to: 'someone@unrelated.test' }), headers: { 'Content-Type': 'application/json' } }, 400],
  ]) {
    const f = fixture({ role: 'admin' })
    assert.equal((await f.notifications.POST(retry(options))).status, status)
    assert.deepEqual(f.dispatchCalls, [])
  }
})

test('retry redirects distinguish accepted, pending, and unconfigured alerts without exposing provider details', async () => {
  for (const [options, notice] of [
    [{ dispatchResult: { sent: 1, failed: 0, configured: true } }, 'notifications_sent'],
    [{ dispatchResult: { sent: 0, failed: 0, configured: true } }, 'notifications_not_ready'],
    [{ dispatchResult: { sent: 1, failed: 1, configured: true } }, 'notifications_pending'],
    [{ dispatchResult: { sent: 0, failed: 0, configured: false } }, 'notifications_unconfigured'],
    [{ dispatchThrows: true }, 'notifications_pending'],
  ]) {
    const f = fixture({ role: 'admin', ...options })
    const response = await f.notifications.POST(retry({
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retry' }),
    }))
    assert.equal(response.status, 303)
    assert.equal(new URL(response.headers.get('Location')).searchParams.get('notice'), notice)
    assert.equal(f.dispatchCalls.length, 1)
  }
})
