import assert from 'node:assert/strict'
import test from 'node:test'
import { signUpSchema } from '../lib/validations'

test('short signup needs no password or Instagram account and trims input', () => {
  const result = signUpSchema.parse({ full_name: '  Alex Guide  ', email: '  alex@example.com  ' })
  assert.equal(result.full_name, 'Alex Guide')
  assert.equal(result.email, 'alex@example.com')
  assert.equal(result.instagram_handle, undefined)
})

test('signup validates names, emails and optional Instagram handles', () => {
  const basic = { full_name: 'Alex Guide', email: 'alex@example.com' }
  for (const handle of ['', '@alex.guide', 'alex_guide']) {
    assert.equal(signUpSchema.safeParse({ ...basic, instagram_handle: handle }).success, true)
  }
  for (const handle of ['https://instagram.com/alex', '@', '<script>', 'a'.repeat(31)]) {
    assert.equal(signUpSchema.safeParse({ ...basic, instagram_handle: handle }).success, false)
  }
  assert.equal(signUpSchema.safeParse({ ...basic, full_name: '  ' }).success, false)
  assert.equal(signUpSchema.safeParse({ ...basic, email: 'not-an-email' }).success, false)
})
