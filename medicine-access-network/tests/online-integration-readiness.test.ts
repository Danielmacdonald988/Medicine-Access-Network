import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { getResource } from '../lib/resources'

test('online readiness is an anchored part of the existing integration guide', () => {
  const resource = getResource('integration-basics')!
  const headings = resource.blocks.filter(b => b.type === 'h3' && b.id === 'online-integration-readiness')
  assert.equal(headings.length, 1)
  const page = readFileSync(new URL('../app/integration-support/page.tsx', import.meta.url), 'utf8')
  assert.ok(page.includes('<a className={linkStyle} href="/resources/integration-basics#online-integration-readiness"'), 'Use native document fragment navigation rather than router scroll handling')
  assert.ok(page.includes("canonical: '/integration-support'"))
  const renderer = readFileSync(new URL('../app/resources/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.ok(renderer.includes('id={block.id}'))
  const text = JSON.stringify(resource.blocks)
  for (const term of ['physically be', 'traveling', 'AI note-taking', 'captions', 'connection drops', 'not worldwide availability', 'covered by HIPAA']) assert.ok(text.includes(term), term)
  const sources = resource.blocks.filter(b => b.type === 'p' && b.links?.some(l => l.href.includes('telehealth.hhs.gov')))
  assert.equal(sources.length, 1)
  assert.equal(resource.sourceCheck?.date, '2026-09-06', 'Do not falsely refresh unrelated support-line checks')
})
