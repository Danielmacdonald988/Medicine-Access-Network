import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resourceProfileShortcut } from '../lib/resource-navigation'
import { getResource } from '../lib/resources'
import { parseFacilitatorFilters } from '../lib/facilitator-search'

test('article shortcuts use existing exact service filters, without implied location or online availability', () => {
  for (const [slug, service] of [
    ['questions-to-ask', undefined],
    ['preparation-basics', 'Preparation education'],
    ['integration-basics', 'Integration conversations'],
    ['integration-circles-vs-individual', 'Integration conversations'],
  ] as const) {
    assert.ok(getResource(slug))
    const shortcut = resourceProfileShortcut(slug)
    assert.ok(shortcut)
    const url = new URL(shortcut.href, 'https://example.test')
    assert.equal(url.pathname, '/facilitators')
    assert.equal(url.hash, '#guide-results')
    assert.deepEqual(parseFacilitatorFilters(url.searchParams).modalities, service ? [service] : [])
    assert.deepEqual([...url.searchParams.keys()], service ? ['modality'] : [])
  }
})

test('no promotional shortcut is added to other resources or unknown keys', () => {
  for (const slug of ['emergency-resources', 'red-flags', 'unknown', 'constructor', '__proto__']) {
    assert.equal(resourceProfileShortcut(slug), undefined)
  }
})

test('shortcut stays optional, tappable and points at a focusable results target', () => {
  const resource = readFileSync('app/resources/[slug]/page.tsx', 'utf8')
  const directory = readFileSync('components/search/DirectoryResults.tsx', 'utf8')
  assert.match(resource, /profileShortcut && <nav/)
  assert.match(resource, /You can keep reading first/)
  assert.match(resource, /href=\{profileShortcut.href\} className="[^"]*min-h-11/)
  assert.match(directory, /id="guide-results" tabIndex=\{-1\}/)
  assert.match(directory, /scroll-mt-24/)
  assert.match(directory, /window.location.hash !== '#guide-results'/)
  assert.match(directory, /scrollIntoView/)
  assert.match(directory, /focus\(\{ preventScroll: true \}\)/)
})
