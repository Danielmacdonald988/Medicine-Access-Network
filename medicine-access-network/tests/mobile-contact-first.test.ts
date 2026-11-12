import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

test('on narrow screens the contact panel precedes the bio and services', () => {
  const css = readFileSync(new URL('../app/facilitators/[id]/profile-header.module.css', import.meta.url), 'utf8')
  const mobile = css.match(/\.header \{[^}]*grid-template-areas: ([^;]+);/)?.[1] ?? ''
  const areas = mobile.split("' '").join(' ').replace(/'/g, '').split(' ')
  assert.ok(areas.indexOf('contact') > -1 && areas.indexOf('contact') < areas.indexOf('services'), mobile)
  // Desktop keeps contact in its own right-hand column next to the content.
  assert.match(css, /@media \(min-width: 1024px\)[\s\S]*'photo identity contact' 'services services contact'/)
})
