import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recordEngagement, excludeEngagement } from '../lib/engagement-client'

const flush = () => new Promise(resolve => setImmediate(resolve))

test('client orders and deduplicates signals, honors privacy controls, and tolerates blocked storage/network', async () => {
  const names = ['window', 'location', 'navigator', 'sessionStorage', 'fetch'] as const
  const original = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]))
  const calls: { session: string; event: string; step: number; source: string; device: string }[] = []
  const browserNavigator = { userAgent: 'Mobile', doNotTrack: '0', globalPrivacyControl: false }
  const originalNow = Date.now
  let now = originalNow()
  Date.now = () => now
  let fail = false
  let gate: Promise<void> | undefined
  const replace = (key: string, value: unknown) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const browserWindow = { location: { search: '' }, sessionStorage: { getItem() { return null } } }
  replace('window', browserWindow)
  replace('location', { pathname: '/signup', hostname: 'thefacilitatornetwork.com' })
  // document.referrer is intentionally a separate restored property.
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  replace('document', { referrer: 'https://linktr.ee/thefacilitatornetwork' })
  replace('navigator', browserNavigator)
  replace('sessionStorage', { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } })
  replace('fetch', async (_url: string, options: {body: string}) => {
    if (fail) throw new Error('offline')
    calls.push(JSON.parse(options.body))
    if (gate) await gate
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
    // Fresh tracked visit at hour 0, form start at hour 23, submit at hour 25.
    // Form activity must not extend the first-visit session's 24-hour lifetime.
    now += 25 * 60 * 60 * 1000
    recordEngagement('visit')
    await flush()
    const firstVisitSession = calls.at(-1)?.session
    now += 23 * 60 * 60 * 1000
    recordEngagement('contact_started')
    await flush()
    assert.equal(calls.at(-1)?.session, firstVisitSession)
    now += 2 * 60 * 60 * 1000
    recordEngagement('contact_started') // form repeats start on submission
    recordEngagement('contact_sent')
    await flush()
    assert.notEqual(calls.at(-1)?.session, firstVisitSession)
    assert.equal(calls.at(-1)?.session, calls.at(-2)?.session)
    assert.deepEqual(calls.slice(-2).map(c => c.event), ['contact_started', 'contact_sent'])
    let release!: () => void
    gate = new Promise<void>(resolve => { release = resolve })
    recordEngagement('resource_view')
    await flush() // first event is already in flight
    const beforeQa = calls.length
    recordEngagement('guide_saved') // queued behind the in-flight request
    browserWindow.location.search = '?tfn_qa=1'
    release()
    await flush()
    assert.equal(calls.length, beforeQa, 'queued event must not send after QA is enabled')
    assert.equal(calls.at(-1)?.event, 'resource_view', 'an already sent request cannot be retracted')
  } finally {
    Date.now = originalNow
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
