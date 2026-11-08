import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')

test('editorial lastmod is an explicit verified content date, not runtime freshness', () => {
  const entry = sitemap.split('\n').find(line => line.includes('url: \`${SITE_URL}/psychedelic-facilitator\`'))
  assert.ok(entry)
  assert.match(entry, /lastModified: '\d{4}-\d{2}-\d{2}'/)
  assert.doesNotMatch(sitemap, /lastModified:\s*(?:new Date|Date\.now)/)
})
