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
const qa = load('lib/internal-qa.ts')

test('QA opt-out is explicit, tab-local, reversible and safe when storage is blocked', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const stored = new Map()
  const browser = { location: { search: '' }, sessionStorage: {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
  } }
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: browser })
  try {
    assert.equal(qa.isInternalQa(), false)
    browser.location.search = '?tfn_qa=1'
    assert.equal(qa.isInternalQa(), true)
    assert.deepEqual([...stored], [['tfn-internal-qa', '1']])
    browser.location.search = '?q=integration'
    assert.equal(qa.isInternalQa(), true)
    browser.location.search = '?tfn_qa=0'
    assert.equal(qa.isInternalQa(), false)
    assert.equal(stored.size, 0)
    browser.location.search = '?tfn_qa=yes'
    assert.equal(qa.isInternalQa(), false)
    browser.sessionStorage = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, removeItem() { throw Error('blocked') } }
    browser.location.search = '?tfn_qa=1'
    assert.equal(qa.isInternalQa(), true)
    browser.location.search = ''
    assert.equal(qa.isInternalQa(), false)
    Reflect.deleteProperty(globalThis, 'window')
    assert.equal(qa.isInternalQa(), false)
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('Vercel analytics discards QA events and retains privacy sanitization for ordinary visits', () => {
  let excluded = true
  const { TrafficAnalytics } = load('components/TrafficAnalytics.tsx', {
    '@/lib/internal-qa': { isInternalQa: () => excluded },
    '@vercel/analytics/next': { Analytics: 'analytics' },
  })
  const beforeSend = TrafficAnalytics().props.beforeSend
  const event = { type: 'pageview', url: 'https://www.thefacilitatornetwork.com/facilitators?q=private#private' }
  assert.equal(beforeSend(event), null)
  excluded = false
  assert.deepEqual(beforeSend(event), { ...event, url: 'https://www.thefacilitatornetwork.com/facilitators' })
})

test('coarse analytics exits before creating a session or calling the network for QA', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })
  try {
    const { recordEngagement } = load('lib/engagement-client.ts', {
      './internal-qa': { isInternalQa: () => true },
      './engagement': {},
    })
    // No location, navigator, storage or network dependencies are needed after exclusion.
    assert.doesNotThrow(() => recordEngagement('visit'))
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
