import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('about page declares its own canonical rather than a filtered or unrelated page', () => {
  const page = readFileSync(new URL('../app/about/page.tsx', import.meta.url), 'utf8')
  const metadata = page.split('export const metadata: Metadata = {')[1]?.split('\n}')[0]
  assert.ok(metadata, 'about metadata must be exported')
  assert.match(metadata, /alternates:\s*\{\s*canonical:\s*'\/about'\s*\}/)
  assert.doesNotMatch(metadata, /index:\s*false/)
})
