import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GENERAL_INTRODUCTION,
  profileFormatOptions,
  profileSupportOptions,
} from '../lib/contact-options'

test('contact choices follow the guide’s catalog practices without inventing services', () => {
  assert.deepEqual(
    profileSupportOptions([
      'Integration Coaching',
      ' integration-coaching ',
      'BREATHWORK',
      'Unknown practice',
    ]),
    ['Integration Coaching', 'Breathwork', GENERAL_INTRODUCTION],
  )
  assert.deepEqual(profileSupportOptions([]), [GENERAL_INTRODUCTION])
})

test('a profile without online sessions or a location always permits an email introduction', () => {
  assert.deepEqual(profileFormatOptions(false, '  '), [
    { value: 'async', label: 'Not sure — discuss by email' },
  ])
})

test('online and location details create questions to discuss rather than confirmed session options', () => {
  const online = profileFormatOptions(true)
  assert.deepEqual(
    online.map(({ value }) => value),
    ['async', 'video', 'voice'],
  )
  const located = profileFormatOptions(false, 'Boston')
  assert.deepEqual(
    located.map(({ value }) => value),
    ['async', 'in_person'],
  )
  assert.equal(located[1].label, 'Ask about meeting in person')
})
