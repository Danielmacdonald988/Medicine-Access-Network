import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getResource } from '../lib/resources'

test('educational disclosure names publisher and actual AI assistance without claiming expert review', () => {
  const about = readFileSync('app/about/page.tsx', 'utf8')
  assert.match(about, /id="educational-content" lang="en"/)
  assert.match(about, /The Facilitator Network publishes these guides/)
  assert.match(about, /AI-assisted drafting and editing/)
  assert.match(about, /not to a clinical review of the whole article/)
  assert.match(about, /href="\/contact"[^>]*>Report an error or outdated information/)
  assert.match(about, /do not send medical records or sensitive personal history/)
})

test('integration copy does not assert unsupported durability or required coaching', () => {
  const content = JSON.stringify(getResource('integration-basics')?.blocks)
  assert.doesNotMatch(content, /Insight without integration tends to fade|Without time and support to process it/)
  assert.match(content, /one option, not a requirement/)
  assert.match(content, /cannot promise a particular outcome/)
})
