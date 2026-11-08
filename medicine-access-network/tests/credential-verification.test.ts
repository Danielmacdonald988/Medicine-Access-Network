import assert from 'node:assert/strict'
import test from 'node:test'
import { getResource } from '../lib/resources'

test('facilitator selection gives scoped credential checks and primary-source links', () => {
  const guide = getResource('questions-to-ask')!
  const text = JSON.stringify(guide.blocks)
  for (const phrase of ['license number', 'issuing authority', 'current status', 'online sessions', 'optional and incomplete', 'not a license-verification tool', 'may still be licensed', 'does not guarantee safety', 'does not arrange controlled-substance services']) {
    assert.ok(text.includes(phrase), phrase)
  }
  assert.equal(guide.sourceCheck?.date, '2026-11-08')
  assert.equal(guide.sourceCheck?.sources.length, 3)
  assert.ok(guide.sourceCheck?.sources.every(source => new URL(source.url).hostname === 'www.oregon.gov'))
  assert.match(guide.sourceCheck!.scope, /not a clinical or legal review/)
})
