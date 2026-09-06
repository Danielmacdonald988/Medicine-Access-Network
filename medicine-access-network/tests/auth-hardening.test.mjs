import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const root = new URL('../', import.meta.url)

function loadModule(path, { mocks = {}, env = {}, logs = [] } = {}) {
  const source = readFileSync(new URL(path, root), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const loadedModule = { exports: {} }
  const capturedConsole = {
    error: (...args) => logs.push({ level: 'error', args }),
    warn: (...args) => logs.push({ level: 'warn', args }),
  }
  new Function('require', 'module', 'exports', 'process', 'console', code)(
    (name) => name in mocks ? mocks[name] : require(name),
    loadedModule,
    loadedModule.exports,
    { env },
    capturedConsole,
  )
  return loadedModule.exports
}

const redirectModule = loadModule('lib/safe-redirect.ts')
const { safeRedirectPath } = redirectModule
const maliciousNextValues = [
  'https://outside.example/path',
  '//outside.example/path',
  '/\\outside.example/path',
  '/%2foutside.example/path',
  '/%5coutside.example/path',
  '/safe/..//outside.example/path',
  '/\t/outside.example/path',
  'javascript:alert(1)',
  '/%E0%A4%A',
]

test('post-auth destinations reject external, encoded, and normalized authority redirects', () => {
  for (const value of [null, undefined, '', ...maliciousNextValues]) {
    const destination = safeRedirectPath(value)
    assert.equal(destination, '/dashboard', `Unsafe next value: ${JSON.stringify(value)}`)
    assert.equal(new URL(destination, 'https://directory.test').origin, 'https://directory.test')
  }
})

test('post-auth destinations preserve password reset and ordinary local query strings', () => {
  for (const path of [
    '/update-password',
    '/facilitator?tab=requests&status=pending#inbox',
    '/facilitators?q=integration%20support',
    '/facilitators?q=preparation%26integration',
  ]) {
    assert.equal(safeRedirectPath(path), path)
  }
  assert.equal(safeRedirectPath('/resources/../facilitators'), '/facilitators')
})

function callbackFixture({ exchangeError = null } = {}) {
  const calls = { clients: 0, exchangeCodes: [], profiles: 0 }
  const logs = []
  const routes = loadModule('app/auth/callback/route.ts', {
    logs,
    mocks: {
      '@/lib/safe-redirect': redirectModule,
      '@/lib/supabaseServer': {
        createServerSupabaseClient: async () => {
          calls.clients += 1
          return {
            auth: {
              exchangeCodeForSession: async (code) => {
                calls.exchangeCodes.push(code)
                return { error: exchangeError }
              },
            },
          }
        },
      },
      '@/lib/auth': {
        getCurrentUser: async () => { calls.profiles += 1; return { id: 'admin-id', role: 'admin' } },
        dashboardPathForRole: () => '/admin',
      },
    },
  })
  return { routes, calls, logs }
}

function callbackRequest(next, code = 'one-time-code') {
  const url = new URL('https://directory.test/auth/callback')
  if (code) url.searchParams.set('code', code)
  if (next !== undefined) url.searchParams.set('next', next)
  return new Request(url)
}

test('callback exchanges a code before redirecting to password reset without loading a dashboard', async () => {
  const { routes, calls } = callbackFixture()
  const response = await routes.GET(callbackRequest('/update-password'))
  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), 'https://directory.test/update-password')
  assert.deepEqual(calls.exchangeCodes, ['one-time-code'])
  assert.equal(calls.profiles, 0)
})

test('callback never follows malicious next values outside the site', async () => {
  for (const next of maliciousNextValues) {
    const { routes } = callbackFixture()
    const response = await routes.GET(callbackRequest(next))
    assert.equal(response.headers.get('location'), 'https://directory.test/admin')
  }
})

test('missing or failed callback codes do not grant redirects and failure logs omit secrets', async () => {
  const missing = callbackFixture()
  const noCodeResponse = await missing.routes.GET(callbackRequest('/update-password', null))
  assert.equal(noCodeResponse.headers.get('location'), 'https://directory.test/login?error=auth_callback_failed')
  assert.equal(missing.calls.clients, 0)

  const failed = callbackFixture({
    exchangeError: { status: 401, message: 'secret-code=secret-123 visitor@example.test', details: 'private-details' },
  })
  const response = await failed.routes.GET(callbackRequest('/update-password', 'secret-123'))
  assert.equal(response.headers.get('location'), 'https://directory.test/login?error=auth_callback_failed')
  assert.equal(failed.calls.profiles, 0)
  assert.deepEqual(failed.logs, [{ level: 'error', args: ['[auth callback] code exchange failed', { status: 401 }] }])
})

function proxyFixture(user, refreshedCookies) {
  return loadModule('proxy.ts', {
    env: { NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon' },
    mocks: {
      '@/lib/safe-redirect': redirectModule,
      '@supabase/ssr': {
        createServerClient: (_url, _key, { cookies }) => ({
          auth: {
            getUser: async () => {
              cookies.setAll(refreshedCookies)
              return { data: { user }, error: null }
            },
          },
        }),
      },
    },
  })
}

test('proxy preserves refreshed session cookies and their options when redirecting signed-in users', async () => {
  const options = { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600 }
  const cookies = [
    { name: 'sb-test-auth-token.0', value: 'refreshed-first-chunk', options },
    { name: 'sb-test-auth-token.1', value: 'refreshed-second-chunk', options },
  ]
  const { proxy } = proxyFixture({ id: 'signed-in-user' }, cookies)
  const request = new NextRequest('https://directory.test/login?next=%2Fupdate-password')
  const response = await proxy(request)
  assert.equal(response.headers.get('location'), 'https://directory.test/update-password')
  for (const { name, value } of cookies) {
    assert.equal(request.cookies.get(name).value, value)
    const cookie = response.cookies.get(name)
    assert.equal(cookie.value, value)
    for (const [key, expected] of Object.entries(options)) assert.equal(cookie[key], expected)
  }
  assert.equal(response.headers.getSetCookie().length, 2)
})

test('proxy preserves cookie deletion and the requested query when sending unauthenticated users to login', async () => {
  const { proxy } = proxyFixture(null, [
    { name: 'sb-test-auth-token', value: '', options: { path: '/', maxAge: 0, httpOnly: true } },
  ])
  const response = await proxy(new NextRequest('https://directory.test/facilitator?tab=requests&status=pending'))
  const redirect = new URL(response.headers.get('location'))
  assert.equal(redirect.pathname, '/login')
  assert.equal(redirect.searchParams.get('next'), '/facilitator?tab=requests&status=pending')
  assert.equal(redirect.searchParams.get('tab'), null)
  assert.equal(response.cookies.get('sb-test-auth-token').value, '')
  assert.equal(response.cookies.get('sb-test-auth-token').maxAge, 0)
})

test('proxy rejects unsafe next destinations for an existing session', async () => {
  const { proxy } = proxyFixture({ id: 'signed-in-user' }, [])
  for (const next of maliciousNextValues) {
    const url = new URL('https://directory.test/login')
    url.searchParams.set('next', next)
    const response = await proxy(new NextRequest(url))
    assert.equal(response.headers.get('location'), 'https://directory.test/dashboard')
  }
})

test('auth construction, lookup, and thrown query outages degrade to a logged-out navbar without private error data', async () => {
  const sensitiveError = new Error('secret-key private-inquiry visitor@example.test')
  for (const stage of ['construction', 'auth', 'profile']) {
    const logs = []
    const { getCurrentUser } = loadModule('lib/auth.ts', {
      logs,
      mocks: {
        'next/navigation': { redirect() { throw new Error('Unexpected navigation') } },
        '@/lib/supabaseServer': {
          createServerSupabaseClient: async () => {
            if (stage === 'construction') throw sensitiveError
            return {
              auth: { getUser: async () => {
                if (stage === 'auth') throw sensitiveError
                return { data: { user: { id: 'user-id', email: 'visitor@example.test' } }, error: null }
              } },
              from() { throw sensitiveError },
            }
          },
        },
      },
    })
    assert.equal(await getCurrentUser(), null)
    assert.deepEqual(logs, [{ level: 'error', args: ['[getCurrentUser] authentication service unavailable'] }])
  }
})

test('a failed profile lookup logs only an error code and never attempts recovery', async () => {
  const logs = []
  let inserts = 0
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: null, error: { code: '42501', message: 'private-inquiry visitor@example.test' } }),
    insert: async () => { inserts += 1; return { error: null } },
  }
  const { getCurrentUser } = loadModule('lib/auth.ts', {
    logs,
    mocks: {
      'next/navigation': { redirect() { throw new Error('Unexpected navigation') } },
      '@/lib/supabaseServer': {
        createServerSupabaseClient: async () => ({
          auth: { getUser: async () => ({ data: { user: { id: 'user-id' } }, error: null }) },
          from: () => query,
        }),
      },
    },
  })
  assert.equal(await getCurrentUser(), null)
  assert.equal(inserts, 0)
  assert.deepEqual(logs, [{ level: 'error', args: ['[getCurrentUser] users lookup failed', { code: '42501' }] }])
})

const productionConfig = {
  VERCEL_ENV: 'production',
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-private-service-key',
  NEXT_PUBLIC_APP_URL: 'https://directory.test',
  NEXT_PUBLIC_PAYMENTS_ENABLED: 'false',
}

test('production configuration fails closed for every missing required field and omits supplied secrets', () => {
  for (const field of [
    'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_APP_URL',
  ]) {
    const env = { ...productionConfig }
    delete env[field]
    const { validateEnv } = loadModule('lib/env.ts', { env })
    assert.throws(validateEnv, (error) => {
      assert.ok(error.message.includes(field))
      assert.equal(error.message.includes('test-private-service-key'), false)
      assert.equal(error.message.includes('test-public-key'), false)
      return true
    })
  }
})

test('production configuration requires a secure origin and keeps payments disabled', () => {
  for (const url of [
    'http://directory.test', 'https://directory.test/some/path',
    'https://directory.test?query=1', 'https://directory.test#fragment',
    'https://name:password@directory.test',
  ]) {
    const { validateEnv } = loadModule('lib/env.ts', { env: { ...productionConfig, NEXT_PUBLIC_APP_URL: url } })
    assert.throws(validateEnv, /NEXT_PUBLIC_APP_URL/)
  }
  const insecureDb = loadModule('lib/env.ts', { env: { ...productionConfig, NEXT_PUBLIC_SUPABASE_URL: 'http://project.supabase.co' } })
  assert.throws(insecureDb.validateEnv, /NEXT_PUBLIC_SUPABASE_URL/)
  const enabledPayments = loadModule('lib/env.ts', { env: { ...productionConfig, NEXT_PUBLIC_PAYMENTS_ENABLED: 'true' } })
  assert.throws(enabledPayments.validateEnv, /NEXT_PUBLIC_PAYMENTS_ENABLED/)
})

test('production accepts complete configuration and identifies email-only degradation without exposing credentials', () => {
  const logs = []
  const noEmail = loadModule('lib/env.ts', { env: productionConfig, logs })
  assert.doesNotThrow(noEmail.validateEnv)
  assert.equal(logs.length, 1)
  assert.equal(logs[0].level, 'warn')
  assert.match(logs[0].args[0], /Email notifications are not configured/)
  assert.equal(JSON.stringify(logs).includes('test-private-service-key'), false)

  const completeLogs = []
  const complete = loadModule('lib/env.ts', {
    env: { ...productionConfig, RESEND_API_KEY: 'test-email-key', RESEND_FROM_EMAIL: 'notifications@directory.test' },
    logs: completeLogs,
  })
  assert.doesNotThrow(complete.validateEnv)
  assert.deepEqual(completeLogs, [])
})

test('local development, preview, and isolated CI builds do not require production credentials', () => {
  for (const env of [{}, { NODE_ENV: 'development' }, { VERCEL_ENV: 'preview' }, { CI: 'true', NODE_ENV: 'production' }]) {
    const logs = []
    const { validateEnv } = loadModule('lib/env.ts', { env, logs })
    assert.doesNotThrow(validateEnv)
    assert.deepEqual(logs, [])
  }
})

function signoutFixture(error = null) {
  const calls = { clients: 0, signouts: 0 }
  const routes = loadModule('app/api/auth/signout/route.ts', {
    mocks: {
      '@/lib/request-body': loadModule('lib/request-body.ts'),
      '@/lib/supabaseServer': {
        createServerSupabaseClient: async () => {
          calls.clients += 1
          return { auth: { signOut: async () => { calls.signouts += 1; return { error } } } }
        },
      },
    },
  })
  return { routes, calls }
}

test('signout is POST-only and rejects cross-site requests before accessing the session', async () => {
  for (const headers of [
    { Origin: 'https://outside.example' },
    { Origin: 'null' },
    { 'Sec-Fetch-Site': 'cross-site' },
    { Origin: 'https://directory.test', 'Sec-Fetch-Site': 'cross-site' },
  ]) {
    const { routes, calls } = signoutFixture()
    assert.equal(routes.GET, undefined)
    assert.equal(typeof routes.POST, 'function')
    const response = await routes.POST(new Request('https://directory.test/api/auth/signout', { method: 'POST', headers }))
    assert.equal(response.status, 403)
    assert.deepEqual(calls, { clients: 0, signouts: 0 })
  }
})

test('same-origin signout clears the session once and redirects with 303 for a GET navigation', async () => {
  const { routes, calls } = signoutFixture()
  const response = await routes.POST(new Request('https://directory.test/api/auth/signout', {
    method: 'POST', headers: { Origin: 'https://directory.test', 'Sec-Fetch-Site': 'same-origin' },
  }))
  assert.deepEqual(calls, { clients: 1, signouts: 1 })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), 'https://directory.test/')
})

test('failed signout returns a retryable 503 without claiming success or exposing auth error details', async () => {
  const { routes, calls } = signoutFixture({ message: 'private-token visitor@example.test', status: 500 })
  const response = await routes.POST(new Request('https://directory.test/api/auth/signout', {
    method: 'POST', headers: { Origin: 'https://directory.test' },
  }))
  assert.deepEqual(calls, { clients: 1, signouts: 1 })
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('location'), null)
  assert.deepEqual(await response.json(), { error: 'Could not sign out. Please try again.' })
})
