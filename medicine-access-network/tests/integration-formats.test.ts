import assert from 'node:assert/strict'
import test from 'node:test'
import { getResource } from '../lib/resources'

test('integration format guide is linked and scopes peer and clinical services', () => {
  const guide = getResource('integration-circles-vs-individual')!
  assert.ok(guide)
  assert.ok(getResource('integration-basics')?.relatedSlugs?.includes(guide.slug))
  const text = JSON.stringify(guide)
  for (const phrase of ['cannot guarantee', 'not automatically a clinical service', 'does not confirm group availability', 'An inquiry is not a booking', 'one-to-one', 'licensed healthcare professional']) assert.ok(text.includes(phrase), phrase)
  assert.ok(guide.relatedSlugs?.includes('emergency'))
  assert.equal(guide.sourceCheck?.sources.length, 3)
  assert.ok(guide.sourceCheck?.scope.includes('clinical group therapy'))
  assert.ok(!text.includes('worldwide'))
})


test('source-check dates render as valid ISO dates in the resource template', () => {
  const date = getResource('integration-circles-vs-individual')!.sourceCheck!.date
  assert.match(date, /^\d{4}-\d{2}-\d{2}$/)
  const renderedDate = new Date(`${date}T12:00:00Z`)
  assert.equal(renderedDate.toISOString().slice(0, 10), date)
  assert.equal(renderedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }), 'November 8, 2026')
})
