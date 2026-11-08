import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { organizationStructuredData, serializeStructuredData, ORGANIZATION_DESCRIPTION } from '../lib/organization-identity'

test('brand graph connects website to organization without unverified claims or personal identity', () => {
  const data = organizationStructuredData()
  const [organization, website] = data['@graph']
  assert.equal(organization['@type'], 'Organization')
  assert.equal(organization.name, 'The Facilitator Network')
  assert.deepEqual(organization.sameAs, ['https://www.instagram.com/thefacilitatornetwork/', 'https://www.youtube.com/@thefacilitatornetwork'])
  assert.deepEqual(website.publisher, { '@id': organization['@id'] })
  assert.doesNotMatch(JSON.stringify(data), /founder|employee|legalName|address|telephone|github|Macdonald|MedicalOrganization|aggregateRating/)
  assert.match(ORGANIZATION_DESCRIPTION, /self-reported/)
  assert.match(ORGANIZATION_DESCRIPTION, /does not provide treatment/)
})

test('visible definition matches markup and JSON-LD is safely serialized', () => {
  const about = readFileSync(new URL('../app/about/page.tsx', import.meta.url), 'utf8')
  const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(about, /\{ORGANIZATION_DESCRIPTION\}/)
  assert.match(about, /OFFICIAL_BRAND_PROFILES.map/)
  assert.match(home, /serializeStructuredData\(organizationStructuredData\(\)\)/)
  const value = { text: '</script><script>alert(1)</script>' }
  assert.doesNotMatch(serializeStructuredData(value), /</)
  assert.deepEqual(JSON.parse(serializeStructuredData(value)), value)
})
