import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const eventId = '11111111-1111-4111-8111-111111111111'
const profileId = '22222222-2222-4222-8222-222222222222'
const claimToken = '33333333-3333-4333-8333-333333333333'
const nextEvent = '44444444-4444-4444-8444-444444444444'
const secretDetail = 'private-application-and-provider-credentials'
const configuredEnv = {
  RESEND_API_KEY: 'server-only-api-key',
  RESEND_FROM_EMAIL: 'The Facilitator Network <notifications@example.test>',
  ADMIN_NOTIFICATION_EMAIL: 'admin@example.test',
}
const row = { id: eventId, profile_id: profileId, claim_token: claimToken }
type DispatchResult = { sent: number; failed: number; configured: boolean }
type Exports = {
  isAdminNotificationConfigured: () => boolean
  sendAdminApplicationNotification: (input: { eventId: unknown; profileId: unknown; [key: string]: unknown }) => Promise<{ sent: boolean }>
  dispatchAdminApplicationNotifications: (input?: { profileId?: string }) => Promise<DispatchResult>
}
type RpcCall = { name: string; args: Record<string, unknown>; signal?: AbortSignal }
type FetchCall = { url: string; options: RequestInit }
type Options = {
  env?: Record<string, string | undefined>
  site?: string
  rows?: unknown
  claimError?: boolean
  clientThrows?: boolean
  claimThrows?: boolean
  finish?: Array<'success' | 'error' | 'false' | 'throw'>
  provider?: Array<number | 'throw' | 'timeout'>
}

const code = ts.transpileModule(readFileSync(new URL('../lib/admin-notifications.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

function fixture(options: Options = {}) {
  const fetches: FetchCall[] = []
  const rpcCalls: RpcCall[] = []
  const deadlines: number[] = []
  const logs: unknown[][] = []
  let clients = 0
  let finishIndex = 0
  const api = { exports: {} as Exports }
  const mocks: Record<string, unknown> = {
    'server-only': {},
    '@/lib/constants': { SITE_URL: options.site ?? 'https://directory.test' },
    '@/lib/supabaseAdmin': {
      createAdminSupabaseClient() {
        clients += 1
        if (options.clientThrows) throw new Error(secretDetail)
        return {
          rpc(name: string, args: Record<string, unknown>) {
            const call: RpcCall = { name, args }
            rpcCalls.push(call)
            return {
              async abortSignal(signal: AbortSignal) {
                call.signal = signal
                if (name === 'claim_admin_application_notifications') {
                  if (options.claimThrows) throw new Error(secretDetail)
                  return { data: options.rows === undefined ? [row] : options.rows, error: options.claimError ? { message: secretDetail } : null }
                }
                assert.equal(name, 'finish_admin_application_notification')
                const finish = options.finish?.[finishIndex++] ?? 'success'
                if (finish === 'throw') throw new Error(secretDetail)
                return { data: finish !== 'false', error: finish === 'error' ? { message: secretDetail } : null }
              },
            }
          },
        }
      },
    },
  }
  const fetch = async (url: string, request: RequestInit) => {
    const outcome = options.provider?.[fetches.length] ?? 200
    fetches.push({ url, options: request })
    if (outcome === 'throw') throw new Error(secretDetail)
    if (outcome === 'timeout') {
      await new Promise((_resolve, reject) => {
        request.signal!.addEventListener('abort', () => reject(new Error(secretDetail)), { once: true })
      })
    }
    return {
      ok: typeof outcome === 'number' && outcome >= 200 && outcome < 300,
      status: outcome,
      text() { assert.fail('Provider diagnostics must not be read') },
      json() { assert.fail('Provider diagnostics must not be read') },
    }
  }
  new Function('require', 'module', 'exports', 'process', 'fetch', 'AbortSignal', 'console', code)(
    (name: string) => {
      assert.ok(name in mocks, `Unexpected dependency ${name}`)
      return mocks[name]
    },
    api, api.exports,
    { env: { ...configuredEnv, ...options.env } },
    fetch,
    {
      timeout(ms: number) {
        deadlines.push(ms)
        return options.provider?.includes('timeout') ? AbortSignal.timeout(1) : new AbortController().signal
      },
    },
    { warn: (...args: unknown[]) => logs.push(args), error: (...args: unknown[]) => logs.push(args) },
  )
  return { api: api.exports, fetches, rpcCalls, deadlines, logs, clientCount: () => clients }
}

test('missing provider or admin email configuration skips sending and leaves the outbox unclaimed', async () => {
  for (const key of Object.keys(configuredEnv)) {
    for (const value of [undefined, '', '   ']) {
      const check = fixture({ env: { [key]: value } })
      assert.equal(check.api.isAdminNotificationConfigured(), false)
      assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId, profileId }), { sent: false })
      assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 0, failed: 0, configured: false })
      assert.equal(check.clientCount(), 0)
      assert.deepEqual(check.fetches, [])
    }
  }
})

test('non-production Vercel environments cannot claim or send alerts even with complete provider configuration', async () => {
  for (const environment of ['preview', 'development', '', 'unknown']) {
    const check = fixture({ env: { VERCEL_ENV: environment } })
    assert.equal(check.api.isAdminNotificationConfigured(), false)
    assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId, profileId }), { sent: false })
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 0, failed: 0, configured: false })
    assert.equal(check.clientCount(), 0)
    assert.deepEqual(check.rpcCalls, [])
    assert.deepEqual(check.fetches, [])
  }
  for (const environment of ['production', undefined]) {
    const check = fixture({ env: { VERCEL_ENV: environment } })
    assert.equal(check.api.isAdminNotificationConfigured(), true)
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 1, failed: 0, configured: true })
  }
})

test('configuration accepts one admin address and a plain or named sender, rejecting recipient lists and header injection', () => {
  for (const from of [configuredEnv.RESEND_FROM_EMAIL, 'notifications@example.test']) {
    assert.equal(fixture({ env: { RESEND_FROM_EMAIL: from } }).api.isAdminNotificationConfigured(), true)
  }
  for (const to of ['first@example.test,second@example.test', 'first@example.test;second@example.test', 'Name <admin@example.test>', 'admin@example.test\r\nBcc:second@example.test', 'invalid', `${'a'.repeat(255)}@example.test`]) {
    assert.equal(fixture({ env: { ADMIN_NOTIFICATION_EMAIL: to } }).api.isAdminNotificationConfigured(), false, to)
  }
  for (const from of ['Name\r\nBcc:other@example.test <mail@example.test>', 'Name <bad>', 'first@example.test,second@example.test']) {
    assert.equal(fixture({ env: { RESEND_FROM_EMAIL: from } }).api.isAdminNotificationConfigured(), false)
  }
  assert.equal(fixture({ env: { RESEND_API_KEY: 'key\r\nsecret' } }).api.isAdminNotificationConfigured(), false)
})

test('admin email contains only an authenticated review link and ignores client-supplied destinations or personal details', async () => {
  const check = fixture()
  assert.deepEqual(await check.api.sendAdminApplicationNotification({
    eventId, profileId,
    to: 'attacker@example.test',
    reviewUrl: 'https://attacker.test/collect',
    name: secretDetail,
    biography: secretDetail,
    visitorEmail: 'visitor-private@example.test',
  }), { sent: true })
  assert.equal(check.fetches.length, 1)
  const { url, options } = check.fetches[0]
  assert.equal(url, 'https://api.resend.com/emails')
  assert.equal(options.method, 'POST')
  assert.equal(options.cache, 'no-store')
  assert.ok(options.signal instanceof AbortSignal)
  const payload = JSON.parse(options.body as string)
  assert.deepEqual(Object.keys(payload).sort(), ['from', 'subject', 'text', 'to'])
  assert.equal(payload.to, 'admin@example.test')
  assert.equal(payload.from, configuredEnv.RESEND_FROM_EMAIL)
  assert.match(payload.text, new RegExp(`https://directory\\.test/admin#application-${profileId}`))
  assert.doesNotMatch(options.body as string, /attacker|private|biography|server-only-api-key/)
  assert.doesNotMatch(payload.subject, new RegExp(profileId))
  assert.deepEqual(check.deadlines, [5_000])
  assert.deepEqual(check.logs, [])
})

test('retries retain a canonical event idempotency key while a new application event gets a new key', async () => {
  const uppercaseEvent = 'abcdefab-abcd-4bcd-8bcd-abcdefabcdef'
  const check = fixture()
  for (const id of [uppercaseEvent.toUpperCase(), uppercaseEvent, nextEvent]) {
    await check.api.sendAdminApplicationNotification({ eventId: id, profileId })
  }
  const keys = check.fetches.map(call => new Headers(call.options.headers).get('Idempotency-Key'))
  assert.equal(keys[0], `facilitator-application/${uppercaseEvent}`)
  assert.equal(keys[0], keys[1])
  assert.notEqual(keys[1], keys[2])
  assert.doesNotMatch(JSON.stringify(check.fetches), new RegExp(claimToken))
})

test('malformed identifiers never reach email or become links, headers, or claim arguments', async () => {
  for (const invalid of ['', `${profileId}\n`, `${profileId}/other`, `https://attacker.test/${profileId}`, '../admin', {}, null]) {
    const check = fixture()
    assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId, profileId: invalid }), { sent: false })
    assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId: invalid, profileId }), { sent: false })
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications({ profileId: invalid as string }), { sent: 0, failed: 1, configured: true })
    assert.deepEqual(check.fetches, [])
    assert.equal(check.clientCount(), 0)
  }
})

test('review links require a configured HTTPS origin without credentials, paths, queries or control characters', async () => {
  for (const site of ['http://directory.test', 'javascript:alert(1)', 'https://user:password@directory.test', 'https://directory.test/path', 'https://directory.test?next=attacker', 'https://directory.test#fragment', 'https://directory.test\n', 'not a URL']) {
    const check = fixture({ site })
    assert.equal(check.api.isAdminNotificationConfigured(), false, site)
    assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId, profileId }), { sent: false })
    assert.deepEqual(check.fetches, [])
  }
})

test('provider rejection, network errors and deadline expiry never report acceptance or expose diagnostics', async () => {
  const keepAlive = setTimeout(() => {}, 100)
  try {
    for (const provider of [400, 401, 409, 429, 500, 'throw', 'timeout'] as const) {
      const check = fixture({ provider: [provider] })
      assert.deepEqual(await check.api.sendAdminApplicationNotification({ eventId, profileId }), { sent: false })
      assert.deepEqual(check.logs, [])
      assert.deepEqual(check.deadlines, [5_000])
      if (provider === 'timeout') assert.equal(check.fetches[0].options.signal?.aborted, true)
    }
  } finally {
    clearTimeout(keepAlive)
  }
})

test('dispatch claims a bounded optional profile batch and acknowledges only the token it received', async () => {
  const check = fixture()
  assert.deepEqual(await check.api.dispatchAdminApplicationNotifications({ profileId }), { sent: 1, failed: 0, configured: true })
  assert.deepEqual(check.rpcCalls.map(({ name, args }) => ({ name, args })), [
    { name: 'claim_admin_application_notifications', args: { p_limit: 5, p_profile_id: profileId } },
    { name: 'finish_admin_application_notification', args: { p_id: eventId, p_claim_token: claimToken, p_sent: true } },
  ])
  assert.equal(check.rpcCalls.every(call => call.signal instanceof AbortSignal), true)
  assert.deepEqual(check.deadlines, [3_000, 5_000, 3_000])
})

test('a rejected email is recorded as retryable and does not stop independent claimed events', async () => {
  const check = fixture({ rows: [row, { ...row, id: nextEvent }], provider: [429, 200] })
  assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 1, failed: 1, configured: true })
  assert.deepEqual(check.rpcCalls[0].args, { p_limit: 5, p_profile_id: null })
  assert.deepEqual(check.rpcCalls.slice(1).map(call => call.args.p_sent), [false, true])
  assert.equal(check.fetches.length, 2)
})

test('claim failures and empty queues cannot send unclaimed notifications', async () => {
  for (const options of [{ claimError: true }, { clientThrows: true }, { claimThrows: true }, { rows: null }, { rows: {} }]) {
    const check = fixture(options)
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 0, failed: 1, configured: true })
    assert.deepEqual(check.fetches, [])
    assert.deepEqual(check.logs, [])
  }
  const empty = fixture({ rows: [] })
  assert.deepEqual(await empty.api.dispatchAdminApplicationNotifications(), { sent: 0, failed: 0, configured: true })
  assert.deepEqual(empty.fetches, [])
})

test('failed, refused or thrown acknowledgements remain unsuccessful while later claims still finish', async () => {
  for (const finish of ['error', 'false', 'throw'] as const) {
    const check = fixture({ rows: [row, { ...row, id: nextEvent }], finish: [finish, 'success'] })
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 1, failed: 1, configured: true })
    assert.equal(check.fetches.length, 2)
    assert.deepEqual(check.logs, [])
  }
})

test('malformed claims and claims outside the requested profile are not sent or acknowledged', async () => {
  for (const badRow of [null, {}, { ...row, id: `${eventId}\n` }, { ...row, profile_id: 'https://attacker.test' }, { ...row, claim_token: null }, { ...row, profile_id: nextEvent }]) {
    const check = fixture({ rows: [badRow, row] })
    assert.deepEqual(await check.api.dispatchAdminApplicationNotifications({ profileId }), { sent: 1, failed: 1, configured: true })
    assert.equal(check.fetches.length, 1)
    assert.equal(check.rpcCalls.length, 2)
  }
})

test('dispatch bounds processing even if a malformed provider result exceeds the requested limit', async () => {
  const check = fixture({ rows: Array.from({ length: 6 }, (_, index) => ({ ...row, id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, '0')}` })) })
  assert.deepEqual(await check.api.dispatchAdminApplicationNotifications(), { sent: 5, failed: 0, configured: true })
  assert.equal(check.fetches.length, 5)
  assert.equal(check.rpcCalls.length, 6)
})
