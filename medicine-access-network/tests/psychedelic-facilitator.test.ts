import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
test('facilitator terminology page is discoverable, canonical and accurately scoped', () => {
  const page = source('app/psychedelic-facilitator/page.tsx')
  assert.match(page, /canonical: '\/psychedelic-facilitator'/)
  assert.match(page, /What is a psychedelic facilitator\?/)
  assert.match(page, /does not sell, source, administer or arrange access/)
  assert.match(page, /not a booking or referral service for substance administration/)
  assert.match(page, /not independent verification of qualifications/)
  assert.match(page, /not a universal credential/)
  for (const href of ['/integration-support', '/resources/questions-to-ask', '/resources/scope-of-practice']) assert.ok(page.includes(`href="${href}"`))
  assert.ok(source('app/sitemap.ts').includes('${SITE_URL}/psychedelic-facilitator'))
  for (const path of ['app/resources/page.tsx', 'app/facilitators/page.tsx', 'components/layout/Footer.tsx']) assert.ok(source(path).includes('/psychedelic-facilitator'))
})
