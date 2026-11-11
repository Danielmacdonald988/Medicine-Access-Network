import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

process.env.TZ = 'UTC'
const require = createRequire(import.meta.url)
const createdAt = '2026-10-26T06:16:27.357Z'
const updatedAt = '2026-11-10T04:24:20.209Z'

async function render(updated_at) {
  const queries = []
  const client = { from(table) {
    const calls = []
    const query = { then(resolve) {
      const pending = calls.some(([method, field, value]) => method === 'eq' && field === 'verification_status' && value === 'pending')
      const stats = calls.some(([method, fields]) => method === 'select' && fields === 'verification_status, visibility')
      resolve({ data: pending ? [{
        id: 'profile-id', display_name: 'Example Guide', location: 'Example City',
        created_at: createdAt, updated_at, image_paths: [], modalities: [],
      }] : stats ? [{ verification_status: 'pending', visibility: 'hidden' }] : [], error: null })
    } }
    for (const method of ['select', 'eq', 'in', 'order', 'limit']) {
      query[method] = (...args) => { calls.push([method, ...args]); return query }
    }
    queries.push({ table, calls })
    return query
  } }
  const passthrough = new Proxy({}, { get: (_, key) => String(key) })
  const mocks = {
    '@/lib/i18n/server': { getTranslation: async () => ({
      t: (key, params = {}) => key.replace(/\{(\w+)\}/g, (token, name) => params[name] ?? token), locale: 'en',
    }) },
    '@/lib/supabaseServer': { createServerSupabaseClient: async () => client },
    '@/lib/profile-media': { getProfileImageUrl: () => null },
    '@/lib/direct-contact': { getDirectContactLinks: () => [] },
    '@/lib/admin-notifications': { isAdminNotificationConfigured: () => false },
    '@/components/profile/SocialLinks': passthrough,
    '@/components/admin/EngagementMetrics': passthrough,
    'next/image': { default: 'img', __esModule: true },
    'lucide-react': passthrough,
  }
  for (const name of ['card', 'badge', 'button', 'separator', 'textarea']) {
    mocks['@/components/ui/' + name] = passthrough
  }
  const source = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  const loadedModule = { exports: {} }
  new Function('require', 'module', 'exports', code)(
    name => name in mocks ? mocks[name] : require(name), loadedModule, loadedModule.exports,
  )
  const tree = await loadedModule.exports.default({ searchParams: Promise.resolve({}) })
  return { queries, json: JSON.stringify(tree, (key, value) => typeof value === 'symbol' ? String(value) : value) }
}

test('pending cards distinguish the original application from the latest profile update', async () => {
  const { queries, json } = await render(updatedAt)
  const pendingQuery = queries.find(({ calls }) => calls.some(([method]) => method === 'eq'))
  const fields = pendingQuery.calls.find(([method]) => method === 'select')[1].split(', ')
  assert.ok(fields.includes('created_at'))
  assert.ok(fields.includes('updated_at'))
  assert.match(json, /Original application: Oct 26, 2026/)
  assert.match(json, /Last profile update: Nov 10, 2026/)
  // Contact saves and admin actions also update updated_at. Never label it as
  // proof of a new submission or a new application.
  assert.doesNotMatch(json, /Resubmitted:|Submitted again:/)
})

test('new applications do not repeat an identical update date or invent a missing date', async () => {
  for (const timestamp of [createdAt, null]) {
    const { json } = await render(timestamp)
    assert.match(json, /Original application: Oct 26, 2026/)
    assert.doesNotMatch(json, /Last profile update:|Invalid Date/)
  }
})
