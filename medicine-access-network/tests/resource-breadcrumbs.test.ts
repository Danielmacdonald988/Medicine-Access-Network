import assert from 'node:assert/strict'
import test from 'node:test'
import { resourceBreadcrumbs, breadcrumbJsonLd } from '../lib/resource-breadcrumbs'
import { resources } from '../lib/resources'
import { SITE_URL } from '../lib/constants'

test('every published resource has matching ordered canonical breadcrumb data', () => {
  for (const resource of resources) {
    const crumbs = resourceBreadcrumbs(resource.slug, resource.title, 'Safety library')
    const schema = JSON.parse(breadcrumbJsonLd(crumbs))
    assert.equal(schema['@type'], 'BreadcrumbList')
    assert.deepEqual(schema.itemListElement.map((item: { position: number }) => item.position), [1, 2, 3])
    assert.deepEqual(schema.itemListElement.map((item: { name: string }) => item.name), crumbs.map(c => c.name))
    assert.equal(schema.itemListElement[2].item, `${SITE_URL}/resources/${resource.slug}`)
    assert.equal(schema.itemListElement[0].item, SITE_URL)
  }
})

test('translated labels match navigation and script-closing characters are escaped', () => {
  const json = breadcrumbJsonLd(resourceBreadcrumbs('questions-to-ask', '</script> & Questions', 'Bibliothèque'))
  assert.equal(json.includes('<'), false)
  assert.equal(JSON.parse(json).itemListElement[1].name, 'Bibliothèque')
  assert.equal(JSON.parse(json).itemListElement[2].name, '</script> & Questions')
})
