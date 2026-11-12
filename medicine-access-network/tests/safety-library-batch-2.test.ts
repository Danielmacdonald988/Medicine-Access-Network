import assert from 'node:assert/strict'
import test from 'node:test'
import { getResource } from '../lib/resources'
import { getVerifiedResourceContentDate } from '../lib/resource-content-dates'

const slugs = ['integration-support-after-retreat', 'choosing-somatic-practitioner', 'certificate-vs-license']
const content = (slug: string) => JSON.stringify(getResource(slug)?.blocks)

test('second batch follows platform language rules and claims no unverified dates', () => {
  for (const slug of slugs) {
    const resource = getResource(slug)
    assert.ok(resource, slug)
    assert.ok(resource.searchTitle && resource.description.length <= 160, `${slug} description ${resource.description.length}`)
    assert.doesNotMatch(content(slug), /\b(heals?|healing|cures?|guaranteed|proven to|dos(e|es|ing)|microdos|where to (buy|get)|ceremon(y|ies)|trip)\b/i)
    assert.equal(getVerifiedResourceContentDate(slug), undefined)
    for (const related of resource.relatedSlugs ?? []) assert.ok(getResource(related), `${slug} -> ${related}`)
  }
})

test('retreat guide covers support afterwards only and points to urgent help', () => {
  const text = content('integration-support-after-retreat')
  assert.match(text, /It does not cover choosing, preparing for or taking part in a retreat/)
  assert.match(text, /does not review or recommend retreats/)
  assert.ok(getResource('integration-support-after-retreat')?.relatedSlugs?.includes('emergency'))
})

test('credential guides do not present TFN or a certificate as verification', () => {
  assert.match(content('choosing-somatic-practitioner'), /does not by itself establish a healthcare license/)
  assert.match(content('certificate-vs-license'), /A TFN profile is not license or credential verification/)
  assert.equal(getResource('certificate-vs-license')?.sourceCheck, undefined)
})
