import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'

test('withdrawn contributor PDF is not published or linked under either filename', () => {
  for (const name of ['Kambo_Bufo.pdf', 'Kambo_Bufo_Dan.pdf']) {
    assert.equal(existsSync(`public/downloads/${name}`), false)
  }
  const page = readFileSync('app/resources/page.tsx', 'utf8')
  const config = readFileSync('next.config.ts', 'utf8')
  assert.doesNotMatch(page, /Kambo|Bufo|downloadable-booklets/)
  assert.doesNotMatch(config, /Kambo_Bufo/)
  assert.match(page, /resources\.map/)
  assert.ok(existsSync('public/downloads/TFN-facilitator-comparison.pdf'))
})
