import assert from 'node:assert/strict'
import test from 'node:test'
import {
  directContactUrlSchema,
  getDirectContactLinks,
  normalizeDirectContactUrl,
  TELEGRAM_RESERVED_NAMES,
  type DirectContactPlatform,
} from '../lib/direct-contact'

const signalToken = 'Abcd_123efgh-456'.repeat(4)

test('direct contact accepts canonical person routes and preserves case-sensitive Signal tokens', () => {
  assert.equal(normalizeDirectContactUrl('whatsapp', ' HTTPS://WA.ME/14155552671 '), 'https://wa.me/14155552671')
  assert.equal(normalizeDirectContactUrl('signal', `https://signal.me/#eu/${signalToken}`), `https://signal.me/#eu/${signalToken}`)
  assert.equal(normalizeDirectContactUrl('signal', 'https://signal.me/#p/+14155552671'), 'https://signal.me/#p/+14155552671')
  assert.equal(normalizeDirectContactUrl('telegram', 'https://t.me/Guide_Name'), 'https://t.me/Guide_Name')
})

test('URLs cannot smuggle alternative origins, credentials, ports, queries, or navigation routes', () => {
  for (const [platform, host, path] of [
    ['whatsapp', 'wa.me', '/14155552671'],
    ['signal', 'signal.me', `/#eu/${signalToken}`],
    ['telegram', 't.me', '/Guide_Name'],
  ] as const) {
    for (const input of [
      `http://${host}${path}`, `javascript:alert(1)`, `//${host}${path}`,
      `https://${host}.evil.test${path}`, `https://evil.test@${host}${path}`,
      `https://${host}:443${path}`, `https://${host}:8443${path}`,
      `https://${host}\\evil.test${path}`, `https://${host}/../${path.slice(1)}`,
      `https://${host}/%2e%2e/${path.slice(1)}`, `https://${host}${path}?redirect=https://evil.test`,
      `https://${host}${path}/`, `https://${host}${path}#unexpected`,
      `https://${host.replace('.', '\n.')}${path}`, `https://${host}\u0000${path}`,
      `https://${host}${path.replace(/[A-Za-z0-9]/, '%41')}`,
    ]) {
      assert.equal(normalizeDirectContactUrl(platform, input), null, `${platform}: ${JSON.stringify(input)}`)
      assert.equal(directContactUrlSchema(platform).safeParse(input).success, false)
    }
  }
})

test('WhatsApp and Signal phone routes require bounded international numbers without formatting', () => {
  for (const phone of ['141555', '0123456789', '1'.repeat(16), '+14155552671', '1-415-555-2671', '1 415 555 2671']) {
    assert.equal(normalizeDirectContactUrl('whatsapp', `https://wa.me/${phone}`), null)
    assert.equal(normalizeDirectContactUrl('signal', `https://signal.me/#p/+${phone}`), null)
  }
})

test('Signal accepts only full username share tokens or phone contact routes, not device-link or group routes', () => {
  for (const value of ['a'.repeat(63), 'a'.repeat(65), `${signalToken}=`, `${signalToken.slice(1)}+`, 'username.123']) {
    assert.equal(normalizeDirectContactUrl('signal', `https://signal.me/#eu/${value}`), null)
  }
  for (const link of ['https://signal.me/#u/username.123', `https://signal.group/#${signalToken}`, 'sgnl://linkdevice?uuid=example&pub_key=example']) {
    assert.equal(normalizeDirectContactUrl('signal', link), null)
  }
})

test('Telegram blocks feature routes, malformed usernames, and group invites', () => {
  for (const name of [...TELEGRAM_RESERVED_NAMES, 'LoGiN', 'name', 'a'.repeat(33), '1guide', '_guide', '+123456789', 'joinchat/abc', 'Guide_Name/42']) {
    assert.equal(normalizeDirectContactUrl('telegram', `https://t.me/${name}`), null, name)
  }
  assert.ok(normalizeDirectContactUrl('telegram', 'https://t.me/abcde'))
  assert.ok(normalizeDirectContactUrl('telegram', `https://t.me/${'a'.repeat(32)}`))
})

test('empty optional fields clear to null while invalid types and oversized strings are rejected', () => {
  for (const platform of ['whatsapp', 'signal', 'telegram'] as DirectContactPlatform[]) {
    for (const blank of [null, undefined, '', '   ']) assert.equal(directContactUrlSchema(platform).parse(blank), null)
    for (const invalid of [false, 123, {}, [], 'a'.repeat(321), ' '.repeat(321)]) assert.equal(directContactUrlSchema(platform).safeParse(invalid).success, false)
  }
})

test('public links are revalidated before rendering, including data from legacy or bypassed writes', () => {
  assert.deepEqual(getDirectContactLinks({
    whatsapp_url: 'https://wa.me/14155552671',
    signal_url: 'javascript:alert(1)',
    telegram_url: 'https://t.me/login',
  }), [{ platform: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/14155552671' }])
  assert.deepEqual(getDirectContactLinks({}), [])
})
