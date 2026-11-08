import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getResource, resources } from '../lib/resources'

const emergency = getResource('emergency')!
const paragraphs = emergency.blocks.filter((block) => block.type === 'p')
const links = paragraphs.flatMap((block) => block.links ?? [])

test('urgent-help actions use verified destinations without automatic message bodies', () => {
  assert.deepEqual(links.filter(({ href }) => /^(tel|sms):/.test(href)).map(({ href }) => href), [
    'tel:988', 'sms:988', 'sms:741741', 'tel:+16234737433', 'sms:+16234737433', 'tel:+18006624357',
  ])
  for (const { label, href } of links.filter(({ href }) => /^(tel|sms):/.test(href))) {
    assert.match(label, /\(US\)/)
    assert.doesNotMatch(href, /[?&]/)
  }
  assert.match(links.find(({ href }) => href === 'sms:741741')!.label, /enter HOME/)
})

test('service actions retain scope and hours in their adjacent paragraph', () => {
  const fireside = paragraphs.find((block) => block.links?.some(({ href }) => href === 'tel:+16234737433'))!
  assert.match(fireside.text, /daily from 11 a\.m\. to 11 p\.m\. Pacific/)
  assert.match(fireside.text, /not an emergency service, a suicide hotline, or medical care/)
  assert.match(paragraphs.find((block) => block.links?.some(({ href }) => href === 'tel:+18006624357'))!.text, /treatment referral and information service/)
  assert.match(JSON.stringify(emergency.blocks), /No message sent through this platform is monitored for crisis content/)
})

test('official accessibility and international resources have bounded coverage', () => {
  assert.ok(links.some(({ href }) => href === 'https://988lifeline.org/deaf-hard-of-hearing-hearing-loss/'))
  assert.ok(links.some(({ href }) => href === 'https://www.crisistextline.org/about-us/where-we-are/'))
  assert.match(JSON.stringify(emergency.blocks), /not worldwide services/)
  assert.equal(emergency.sourceCheck?.date, '2026-11-08')
  assert.match(emergency.sourceCheck!.scope, /not a test call or guarantee of availability/)
  assert.equal(resources.filter((r) => r.blocks.some((b) => b.type === 'p' && b.links)).length, 1)
})

test('resource actions remain server-rendered native links with visible focus and touch targets', () => {
  const page = readFileSync('app/resources/[slug]/page.tsx', 'utf8')
  assert.match(page, /<a href=\{link.href\}/)
  assert.match(page, /min-h-11/)
  assert.match(page, /focus-visible:outline-offset-2/)
  assert.doesNotMatch(page, /onClick|window\.location|useEffect/)
})
