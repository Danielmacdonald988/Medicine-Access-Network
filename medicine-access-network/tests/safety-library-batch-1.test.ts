import assert from 'node:assert/strict'
import test from 'node:test'
import { getResource } from '../lib/resources'
import { getVerifiedResourceContentDate } from '../lib/resource-content-dates'

const slugs = ['integration-support-cost', 'choosing-breathwork-facilitator', 'colorado-facilitator-license-check']
const content = (slug: string) => JSON.stringify(getResource(slug)?.blocks)

test('new guides exist, stay within platform language rules and claim no unverified dates', () => {
  for (const slug of slugs) {
    const resource = getResource(slug)
    assert.ok(resource, slug)
    assert.ok(resource.searchTitle && resource.description.length <= 160, slug)
    // No outcome promises, no access or dosing language. ("Healing center" is
    // Colorado's legal term for a licensed venue, so it is not excluded.)
    assert.doesNotMatch(content(slug), /\b(heals?|guaranteed|proven to|dos(e|es|ing)|microdos|where to (buy|get)|ceremony)\b/i)
    assert.match(content(slug), /introductory platform message|not medical advice|not license verification/)
    assert.equal(getVerifiedResourceContentDate(slug), undefined)
  }
})

test('fees guide makes no price, insurance or platform-verification claims', () => {
  const fees = content('integration-support-cost')
  assert.doesNotMatch(fees, /[$€£]\s?\d|\d+\s?(USD|dollars)/)
  assert.match(fees, /Do not assume that insurance/)
  assert.match(fees, /TFN does not set, verify or guarantee them/)
  assert.equal(getResource('integration-support-cost')?.sourceCheck, undefined)
})

test('breathwork guide defers health suitability to healthcare professionals', () => {
  const breathwork = content('choosing-breathwork-facilitator')
  assert.match(breathwork, /qualified healthcare professional before booking an intensive session/)
  assert.match(breathwork, /not the right person to decide whether a practice is medically suitable/)
  assert.doesNotMatch(breathwork, /psychedelic breathwork/i)
  assert.equal(getResource('choosing-breathwork-facilitator')?.sourceCheck?.sources.length, 1)
})

test('Colorado guide points only to official sources and does not present TFN as a verifier', () => {
  const resource = getResource('colorado-facilitator-license-check')
  for (const source of resource?.sourceCheck?.sources ?? []) {
    assert.match(new URL(source.url).hostname, /(^|\.)colorado\.gov$/)
  }
  assert.equal(resource?.sourceCheck?.date, '2026-11-11')
  assert.equal(resource?.nextStep, undefined)
  const text = content('colorado-facilitator-license-check')
  assert.match(text, /A TFN profile is not license verification/)
  assert.match(text, /absence of a Colorado license is not by itself a warning sign/)
})
