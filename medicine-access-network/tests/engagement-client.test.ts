import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recordEngagement, excludeEngagement } from '../lib/engagement-client'

const flush = () => new Promise(resolve => setImmediate(resolve))

test('client orders and deduplicates signals, honors privacy controls, and tolerates blocked storage/network', async () => {
  const names = ['window', 'location', 'navigator', 'sessionStorage', 'fetch'] as const
  const original = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]))
  const calls: { session: string; event: string; step: number; source: string; device: string }[] = []
  const browserNavigator = { userAgent: 'Mobile', doNotTrack: '0', globalPrivacyControl: false }
  let fail = false
  const replace = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  replace('window', {})
  replace('location', { pathname: '/signup', hostname: 'thefacilitatornetwork.com' })
  // document.referrer is intentionally a separate restored property.
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  replace('document', { referrer: 'https://linktr.ee/thefacilitatornetwork' })
  replace('navigator', browserNavigator)
  replace('sessionStorage', { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } })
  replace('fetch', async (_url: string, options: {body: string}) => {
    if (fail) throw new Error('offline')
    calls.push(JSON.parse(options.body))
    return { ok: true }
  })
  try {
    recordEngagement('signup_started')
    recordEngagement('signup_started')
    recordEngagement('signup_accepted')
    await flush()
    assert.deepEqual(calls.map(c => c.event), ['signup_started', 'signup_accepted'])
    assert.equal(calls[0].session, calls[1].session)
    assert.deepEqual(Object.keys(calls[0]).sort(), ['device','event','session','source','step'])
    recordEngagement('signup_started')
    browserNavigator.doNotTrack = '1'
    recordEngagement('profile_view')
    browserNavigator.doNotTrack = '0'
    browserNavigator.globalPrivacyControl = true
    recordEngagement('profile_view')
    browserNavigator.globalPrivacyControl = false
    excludeEngagement(true)
    recordEngagement('profile_view')
    excludeEngagement(false)
    await flush()
    assert.equal(calls.length, 2)
    fail = true
    assert.doesNotThrow(() => recordEngagement('contact_started'))
    await flush()
    fail = false
    recordEngagement('contact_started')
    await flush()
    assert.equal(calls.at(-1)?.event, 'contact_started')
  } finally {
    excludeEngagement(false)
    for (const name of names) {
      const descriptor = original.get(name)
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else Reflect.deleteProperty(globalThis, name)
    }
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument)
    else Reflect.deleteProperty(globalThis, 'document')
  }
})
