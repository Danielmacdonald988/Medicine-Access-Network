import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('comparison worksheet is available only on the choosing guide without changing its canonical', () => {
  const page = readFileSync('app/resources/[slug]/page.tsx', 'utf8')
  assert.match(page, /slug === 'questions-to-ask'/)
  assert.match(page, /canonical: `\/resources\/\$\{resource.slug\}`/)
  assert.match(page, /href="\/downloads\/TFN-facilitator-comparison.pdf" download/)
  assert.match(page, /No account or online answers are needed/)
  assert.match(page, /not a safety score, provider verification or clinical endorsement/)
  const pdf = readFileSync('public/downloads/TFN-facilitator-comparison.pdf')
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
})

test('all worksheet topics have an on-page HTML equivalent without collecting answers', () => {
  const page = readFileSync('app/resources/[slug]/page.tsx', 'utf8')
  const worksheet = page.slice(page.indexOf("slug === 'questions-to-ask'"), page.indexOf('{/* Content */}'))
  for (const topic of ['Proposed service', 'Qualifications', 'Format', 'Fees', 'Cancellation', 'Consent', 'Privacy', 'Scope limits', 'Unanswered questions', 'Your next step']) {
    assert.ok(worksheet.includes(topic), topic)
  }
  assert.match(worksheet, /<details/)
  assert.doesNotMatch(worksheet, /<input|<textarea|<form|localStorage|sessionStorage/)
})
