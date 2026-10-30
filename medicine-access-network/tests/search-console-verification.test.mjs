import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('homepage metadata retains the issued public Google ownership verification', () => {
  const homepage = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(homepage, /verification: \{ google: "v9FuoQDypePAUZLaeVm9PGDbSc4yNFBitg9S_aIYM0I" \}/)
  assert.match(homepage, /alternates: \{ canonical: "\/" \}/)
})
