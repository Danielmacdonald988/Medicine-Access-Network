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

const bodyHelpers = loadModule('lib/request-body.ts')
const schemas = loadModule('lib/validations.ts')
const requestId = 'd83e7d80-e6fa-4528-a981-f088343cb29a'
const privateMarker = 'private-visitor@example.com'
const inquiry = {
  facilitator_profile_id: requestId,
  seeker_name: 'Example Visitor',
  seeker_email: privateMarker,
  requested_service: 'Integration coaching',
  preferred_format: 'video',
  message: 'I would like to discuss integration support and your availability.',
}

const originalEnvironments = new WeakMap()
function setEnv(t, values) {
  let originals = originalEnvironments.get(t)
  if (!originals) {
    originals = new Map()
    originalEnvironments.set(t, originals)
    t.after(() => {
      for (const [key, previous] of originals) {
        if (previous === undefined) delete process.env[key]
        else process.env[key] = previous
      }
    })
  }
  for (const [key, value] of Object.entries(values)) {
    if (!originals.has(key)) originals.set(key, process.env[key])
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

function jsonRequest(body, headers = {}) {
  return new Request('https://directory.test/api/contact-requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.5', ...headers },
    body: JSON.stringify(body),
  })
}

function contactFixture(t, options = {}) {
  setEnv(t, { VERCEL: '1', CONTACT_RATE_LIMIT_SECRET: 'test-rate-limit-secret' })
  const calls = []
  const notifications = []
  const routes = loadModule('app/api/contact-requests/route.ts', {
    '@/lib/request-body': bodyHelpers,
    '@/lib/validations': schemas,
    '@/lib/supabaseAdmin': {
      createAdminSupabaseClient: () => ({
        rpc: async (name, payload) => {
          calls.push({ name, payload })
          if (options.rpcThrows) throw new Error(privateMarker)
          return options.rpcResult ?? {
            data: [{ request_id: requestId, facilitator_email: 'guide@example.com', facilitator_display_name: 'Guide' }],
            error: null,
          }
        },
      }),
    },
    '@/lib/email': {
      sendFacilitatorInquiryEmail: async (input) => {
        notifications.push(input)
        if (options.notificationThrows) throw new Error(privateMarker)
        return { sent: options.notificationSent ?? true }
      },
    },
  })
  return { routes, calls, notifications }
}

test('contact normalizes and bounds user fields before database submission', async (t) => {
  const { routes, calls } = contactFixture(t)
  const response = await routes.POST(jsonRequest({
    ...inquiry, seeker_name: '  Example Visitor  ', seeker_email: ` ${privateMarker} `,
    requested_service: ' Integration coaching ', message: ` ${inquiry.message} `,
  }))
  assert.equal(response.status, 201)
  assert.equal(calls[0].payload.p_seeker_name, inquiry.seeker_name)
  assert.equal(calls[0].payload.p_message, inquiry.message)
  assert.equal(calls[0].payload.p_seeker_email, inquiry.seeker_email)
  assert.match(calls[0].payload.p_rate_limit_key, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(calls).includes('203.0.113.5'), false)
  for (const changed of [
    { seeker_name: '  ' }, { message: ' '.repeat(20) }, { requested_service: 'x'.repeat(201) },
    { seeker_email: `${'a'.repeat(245)}@example.com` },
  ]) {
    assert.equal((await routes.POST(jsonRequest({ ...inquiry, ...changed }))).status, 400)
  }
  assert.equal(calls.length, 1)
})

test('plain-text JSON and oversized streamed bodies never reach the contact database', async (t) => {
  const { routes, calls } = contactFixture(t)
  assert.equal((await routes.POST(jsonRequest(inquiry, { 'Content-Type': 'text/plain' }))).status, 415)
  const encoder = new TextEncoder()
  let cancelled = false
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"message":"'))
      controller.enqueue(encoder.encode('a'.repeat(16_384)))
    },
    cancel() { cancelled = true },
  })
  const response = await routes.POST(new Request('https://directory.test/api/contact-requests', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '10' },
    body: stream, duplex: 'half',
  }))
  assert.equal(response.status, 413)
  assert.equal(cancelled, true)
  assert.equal(calls.length, 0)
})

test('invalid JSON, invalid UTF-8, and interrupted streams are rejected without throwing', async () => {
  for (const body of ['{', new Uint8Array([123, 34, 120, 34, 58, 34, 255, 34, 125]), new ReadableStream({
    start(controller) { controller.error(new Error(privateMarker)) },
  })]) {
    const result = await bodyHelpers.readSmallJson(new Request('https://directory.test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half',
    }))
    assert.equal(result.ok, false)
    assert.equal(result.status, 400)
    assert.equal(JSON.stringify(result).includes(privateMarker), false)
  }
})

test('honeypot submissions return success without storage or notification', async (t) => {
  const { routes, calls, notifications } = contactFixture(t)
  assert.equal((await routes.POST(jsonRequest({ website: 'spam.example' }))).status, 201)
  assert.deepEqual(calls, [])
  assert.deepEqual(notifications, [])
})

test('a saved inquiry stays successful if email is unavailable or unexpectedly throws', async (t) => {
  const errors = t.mock.method(console, 'error', () => {})
  for (const options of [{ notificationSent: false }, { notificationThrows: true }]) {
    const { routes, calls, notifications } = contactFixture(t, options)
    const response = await routes.POST(jsonRequest(inquiry))
    assert.equal(response.status, 201)
    assert.deepEqual(await response.json(), { success: true })
    assert.equal(calls.length, 1)
    assert.equal(notifications.length, 1)
  }
  assert.equal(JSON.stringify(errors.mock.calls).includes(privateMarker), false)
})

test('missing guides and rate limits return distinct errors and never notify', async (t) => {
  for (const [rpcResult, expectedStatus] of [
    [{ data: [], error: null }, 404],
    [{ data: null, error: { code: 'P0001', message: 'contact_rate_limited' } }, 429],
  ]) {
    const { routes, notifications } = contactFixture(t, { rpcResult })
    const response = await routes.POST(jsonRequest(inquiry))
    assert.equal(response.status, expectedStatus)
    if (expectedStatus === 429) assert.equal(response.headers.get('retry-after'), '3600')
    assert.equal(notifications.length, 0)
  }
})

test('database failures and invalid IP addresses fail closed without exposing personal information', async (t) => {
  const errors = t.mock.method(console, 'error', () => {})
  for (const options of [
    { rpcResult: { data: null, error: { code: 'XX000', message: privateMarker, details: inquiry.message } } },
    { rpcThrows: true },
  ]) {
    const { routes, notifications } = contactFixture(t, options)
    const response = await routes.POST(jsonRequest(inquiry))
    assert.equal(response.status, 503)
    assert.equal((await response.text()).includes(privateMarker), false)
    assert.equal(notifications.length, 0)
  }
  const { routes, calls } = contactFixture(t)
  assert.equal((await routes.POST(jsonRequest(inquiry, { 'x-forwarded-for': 'invented-ip' }))).status, 503)
  assert.deepEqual(calls, [])
  assert.equal(JSON.stringify(errors.mock.calls).includes(privateMarker), false)
})

const emailInput = {
  facilitatorEmail: 'guide@example.com', facilitatorDisplayName: 'Guide',
  seekerName: 'Example Visitor', seekerEmail: privateMarker, requestedService: 'Integration coaching',
  message: inquiry.message, preferredFormat: 'video',
}

test('notification sends privately addressed plain text with reply-to and a bounded timeout', async (t) => {
  setEnv(t, { RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'requests@directory.test' })
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails')
    assert.equal(options.cache, 'no-store')
    assert.ok(options.signal instanceof AbortSignal)
    const body = JSON.parse(options.body)
    assert.equal(body.to, emailInput.facilitatorEmail)
    assert.equal(body.reply_to, privateMarker)
    assert.equal(body.subject.includes(emailInput.seekerName), false)
    assert.equal(body.text.includes(inquiry.message), true)
    return new Response('{}', { status: 200 })
  })
  const email = loadModule('lib/email.ts', { 'server-only': {} })
  assert.deepEqual(await email.sendFacilitatorInquiryEmail(emailInput), { sent: true })
  assert.equal(fetchMock.mock.calls.length, 1)
})

test('provider failures, timeouts, and missing configuration are contained without sensitive logging', async (t) => {
  setEnv(t, { RESEND_API_KEY: 'test-key', RESEND_FROM_EMAIL: 'requests@directory.test' })
  const errors = t.mock.method(console, 'error', () => {})
  const warnings = t.mock.method(console, 'warn', () => {})
  const email = loadModule('lib/email.ts', { 'server-only': {} })
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(privateMarker, { status: 429 }))
  assert.deepEqual(await email.sendFacilitatorInquiryEmail(emailInput), { sent: false })
  fetchMock.mock.mockImplementation(async () => { throw new Error(privateMarker) })
  assert.deepEqual(await email.sendFacilitatorInquiryEmail(emailInput), { sent: false })
  delete process.env.RESEND_API_KEY
  assert.deepEqual(await email.sendFacilitatorInquiryEmail(emailInput), { sent: false })
  assert.equal(fetchMock.mock.calls.length, 2)
  assert.equal(JSON.stringify([...errors.mock.calls, ...warnings.mock.calls]).includes(privateMarker), false)
})

function statusFixture({ signedIn = true, missing = false, error = null } = {}) {
  const writes = []
  const filters = []
  const supabase = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'guide-user-id' } : null } }) },
    from(table) {
      assert.equal(table, 'booking_requests')
      const query = {
        update(value) { writes.push(value); return query },
        eq(key, value) { filters.push([key, value]); return query },
        select(columns) { assert.equal(columns, 'id'); return query },
        maybeSingle: async () => ({ data: missing || error ? null : { id: requestId }, error }),
      }
      return query
    },
  }
  const routes = loadModule('app/api/booking-requests/[id]/route.ts', {
    '@/lib/supabaseServer': { createServerSupabaseClient: async () => supabase },
    '@/lib/request-body': bodyHelpers,
  })
  return { routes, writes, filters }
}

function statusRequest(method = 'PATCH', status = 'accepted', headers = {}) {
  return new Request(`https://directory.test/api/booking-requests/${requestId}`, {
    method, headers: { 'Content-Type': method === 'PATCH' ? 'application/json' : 'application/x-www-form-urlencoded', ...headers },
    body: method === 'PATCH' ? JSON.stringify({ status }) : new URLSearchParams({ status }).toString(),
  })
}
const context = (id = requestId) => ({ params: Promise.resolve({ id }) })

test('status writes retain recipient ownership checks and HTML success redirects with GET semantics', async () => {
  for (const method of ['PATCH', 'POST']) {
    const { routes, writes, filters } = statusFixture()
    const response = await routes[method](statusRequest(method), context())
    assert.equal(response.status, method === 'POST' ? 303 : 200)
    assert.deepEqual(writes, [{ status: 'accepted' }])
    assert.deepEqual(filters, [['id', requestId], ['facilitator_id', 'guide-user-id']])
    if (method === 'POST') assert.equal(response.headers.get('location'), 'https://directory.test/facilitator')
  }
})

test('status updates never claim success for missing requests or failed database writes', async (t) => {
  const errors = t.mock.method(console, 'error', () => {})
  for (const method of ['PATCH', 'POST']) {
    for (const [options, expectedStatus] of [
      [{ missing: true }, 404], [{ error: { code: 'XX000', message: privateMarker } }, 503],
    ]) {
      const { routes } = statusFixture(options)
      const response = await routes[method](statusRequest(method), context())
      assert.equal(response.status, expectedStatus)
      assert.equal(response.headers.has('location'), false)
      assert.equal((await response.text()).includes(privateMarker), false)
    }
  }
  assert.equal(JSON.stringify(errors.mock.calls).includes(privateMarker), false)
})

test('status updates reject invalid input, cross-origin forms, and unauthenticated callers without writes', async () => {
  for (const method of ['PATCH', 'POST']) {
    const { routes, writes } = statusFixture()
    assert.equal((await routes[method](statusRequest(method), context('invalid'))).status, 400)
    assert.equal((await routes[method](statusRequest(method, 'invented-status'), context())).status, 400)
    assert.equal((await routes[method](statusRequest(method, 'accepted', { Origin: 'https://unrelated.test' }), context())).status, 403)
    assert.deepEqual(writes, [])
    const anonymous = statusFixture({ signedIn: false })
    const response = await anonymous.routes[method](statusRequest(method), context())
    assert.equal(response.status, method === 'POST' ? 303 : 401)
    if (method === 'POST') assert.equal(response.headers.get('location'), 'https://directory.test/login')
    assert.deepEqual(anonymous.writes, [])
  }
})

test('disabled payments stop checkout and webhook before signature, auth, or database handling', async () => {
  const calls = []
  const mocks = {
    '@/lib/payments': { PAYMENTS_ENABLED: false },
    '@/lib/supabaseServer': {
      createServerSupabaseClient: async () => { calls.push('database'); throw new Error('Should not be reached') },
    },
    '@/lib/stripe': {
      constructWebhookEvent: async () => { calls.push('signature'); throw new Error('Should not be reached') },
      createCheckoutSession: async () => { calls.push('checkout'); throw new Error('Should not be reached') },
    },
  }
  for (const path of ['checkout', 'webhook']) {
    const route = loadModule(`app/api/stripe/${path}/route.ts`, mocks)
    const response = await route.POST(new Request(`https://directory.test/api/stripe/${path}`, { method: 'POST' }))
    assert.equal(response.status, 503)
  }
  assert.deepEqual(calls, [])
})
