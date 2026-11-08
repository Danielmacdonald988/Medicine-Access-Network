import assert from 'node:assert/strict'
import test from 'node:test'
import { mailtoHref } from '../lib/mailto'

test('support email without a profile remains a plain mailto link', () => {
  assert.equal(mailtoHref('support@example.com'), 'mailto:support@example.com')
})

test('concern drafts preserve spaces, punctuation and Unicode for mailto clients', () => {
  const subject = 'Concern about a guide profile'
  const body = 'https://example.com/facilitators/id\n\nPréparation + support & questions?\n'
  const href = mailtoHref('support@example.com', { subject, body })
  assert.ok(href.includes('subject=Concern%20about%20a%20guide%20profile'))
  assert.ok(!href.includes('+'))
  assert.equal(decodeURIComponent(href.split('&body=')[1]), body.replace(/\n/g, '\r\n'))
  assert.ok(href.includes('%2B'))
  assert.ok(href.includes('%26'))
})

test('mail body uses CRLF once for mixed input line endings', () => {
  const href = mailtoHref('support@example.com', { subject: 'Report', body: 'a\r\nb\nc\rd' })
  assert.equal(decodeURIComponent(href.split('&body=')[1]), 'a\r\nb\r\nc\r\nd')
})
