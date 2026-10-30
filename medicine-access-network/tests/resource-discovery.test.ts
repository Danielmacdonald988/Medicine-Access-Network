import assert from 'node:assert/strict'
import test from 'node:test'
import { resources, getResource } from '../lib/resources'
import { MODALITIES } from '../lib/constants'
import { resourceSummaries } from '../lib/i18n/resource-summaries'

test('resource discovery routes resolve to real services without account barriers', () => {
  const seen = new Set<string>()
  for (const resource of resources) {
    assert.ok(!seen.has(resource.slug), `duplicate resource ${resource.slug}`)
    seen.add(resource.slug)
    assert.ok(resourceSummaries[resource.slug], `missing summary ${resource.slug}`)
    for (const slug of resource.relatedSlugs ?? []) assert.ok(getResource(slug), slug)
    if (!resource.nextStep) continue
    const url = new URL(resource.nextStep.href, 'https://example.invalid')
    assert.ok(['/facilitators', '/integration-support'].includes(url.pathname))
    for (const service of url.searchParams.getAll('modality')) {
      assert.ok(MODALITIES.some((item) => item.name === service), `unknown service ${service}`)
    }
  }
  assert.equal(getResource('emergency')?.nextStep, undefined)
  assert.equal(getResource('contraindications')?.nextStep, undefined)
})
