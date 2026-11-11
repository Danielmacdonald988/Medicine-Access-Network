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

test('first-conversation guidance offers a direct, accessible directory path without signup', () => {
  const page = readFileSync(new URL('../app/about/page.tsx', import.meta.url), 'utf8')
  const section = page.split("{t('Keep the first conversation simple')}")[1]?.split('</section>')[0]
  assert.ok(section, 'first-conversation section exists')
  assert.match(section, /not a confirmed booking/)
  assert.match(section, /Leave medical records and sensitive personal history out/)
  assert.match(section, /<Link href="\/facilitators"/)
  assert.match(section, /min-h-11/)
  assert.match(section, /focus-visible:outline-2/)
  assert.match(section, /\{t\('Explore support'\)\}/)
  assert.doesNotMatch(section, /href="\/(signup|login)"/)
})
