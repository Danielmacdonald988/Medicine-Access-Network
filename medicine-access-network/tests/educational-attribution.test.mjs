import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('educational attribution is honest, accessible, and reaches the existing editorial disclosure', () => {
  const component = readFileSync('components/educational-attribution.tsx', 'utf8')
  const about = readFileSync('app/about/page.tsx', 'utf8')
  assert.match(component, /Published by The Facilitator Network/)
  assert.match(component, /href="\/about#educational-content"/)
  assert.match(component, /How this content is prepared and corrected/)
  assert.match(component, /lang="en"/)
  assert.match(component, /min-h-11/)
  assert.match(component, /focus-visible:outline-2/)
  assert.doesNotMatch(component, /reviewed by|clinician|expert|Dan\b|dateModified/i)
  assert.match(about, /id="educational-content"/)
  assert.match(about, /The Facilitator Network publishes these guides/)
  assert.match(about, /AI-assisted drafting and editing/)
})

test('resource articles and facilitator guide include attribution after their heading', () => {
  for (const path of ['app/resources/[slug]/page.tsx', 'app/psychedelic-facilitator/page.tsx']) {
    const page = readFileSync(path, 'utf8')
    assert.match(page, /import \{ EducationalAttribution \} from '@\/components\/educational-attribution'/)
    assert.equal(page.split('<EducationalAttribution />').length - 1, 1)
    assert.ok(page.indexOf('<EducationalAttribution />') > page.indexOf('</h1>'))
  }
})
