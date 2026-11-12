import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resourceArticleStructuredData, resourceArticleJsonLd } from '../lib/resource-article-schema'
import { getVerifiedResourceContentDate } from '../lib/resource-content-dates'
import { resources } from '../lib/resources'
import { SITE_URL } from '../lib/constants'

test('every published resource has canonical Article data tied to the organization', () => {
  for (const resource of resources) {
    const data = resourceArticleStructuredData(resource)
    assert.equal(data['@type'], 'Article')
    assert.equal(data.url, `${SITE_URL}/resources/${resource.slug}`)
    assert.equal(data.mainEntityOfPage, data.url)
    assert.equal(data.headline, resource.searchTitle ?? resource.title)
    assert.equal(data.description, resource.description)
    assert.deepEqual(data.publisher, { '@id': `${SITE_URL}/#organization` })
    assert.deepEqual(data.author, data.publisher)
  }
})

test('dates appear only when verified; no fields beyond the reviewed set', () => {
  for (const resource of resources) {
    const data = resourceArticleStructuredData(resource) as Record<string, unknown>
    assert.equal(data.dateModified, getVerifiedResourceContentDate(resource.slug))
    assert.equal('datePublished' in data, false)
    // Check the schema's own shape, not the article's wording.
    const allowed = ['@context', '@type', '@id', 'headline', 'description', 'url', 'mainEntityOfPage', 'inLanguage', 'isAccessibleForFree', 'author', 'publisher', 'dateModified']
    assert.deepEqual(Object.keys(data).filter(key => !allowed.includes(key)), [])
    assert.equal(data['@type'], 'Article')
  }
})

test('markup is safely serialized and rendered on the resource page', () => {
  const json = resourceArticleJsonLd({ slug: 'x', title: '</script><script>alert(1)</script>', description: 'd' })
  assert.equal(json.includes('<'), false)
  assert.equal(JSON.parse(json).headline, '</script><script>alert(1)</script>')
  const page = readFileSync(new URL('../app/resources/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /resourceArticleJsonLd\(resource\)/)
})

test('a default share image and large card are configured site-wide', () => {
  const image = readFileSync(new URL('../app/opengraph-image.tsx', import.meta.url), 'utf8')
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  assert.match(image, /width: 1200, height: 630/)
  assert.doesNotMatch(image, /heal|cure|treat|therap|ceremon|dos(e|ing)|verified/i)
  assert.match(layout, /card: "summary_large_image"/)
})
