import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { INTEGRATION_DIRECTORY_HREF, loadIntegrationGuides } from '../lib/integration-support'
import { getResource } from '../lib/resources'

function client(fetch: typeof globalThis.fetch) {
  return createClient('https://directory.test', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch } })
}

test('integration discovery uses the public projection, real service aliases and bounded stable ordering', async () => {
  const guide = { id: 'public-guide-id', display_name: 'Current public guide', modalities: ['Psychedelic Integration'] }
  const result = await loadIntegrationGuides(client(async input => {
    const url = new URL(String(input))
    assert.equal(url.pathname, '/rest/v1/facilitator_public_profiles')
    assert.equal(url.searchParams.get('modalities'), 'ov.{Integration conversations,Integration Coaching,Psychedelic Integration}')
    assert.equal(url.searchParams.get('order'), 'display_name.asc,id.asc')
    assert.equal(url.searchParams.get('offset'), '0')
    assert.equal(url.searchParams.get('limit'), '6')
    assert.doesNotMatch(url.searchParams.get('select') ?? '', /bio|safety_practices|lineage_or_training|certifications/)
    assert.equal(url.searchParams.has('location'), false)
    assert.equal(url.searchParams.has('remote_available'), false)
    return new Response(JSON.stringify([guide]), { headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/9' } })
  }))
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.guides, [guide])
  assert.equal(result.total, 9)
})

test('empty profiles are distinct from query errors and transport failures', async () => {
  const empty = await loadIntegrationGuides(client(async () => new Response('[]', { headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' } })))
  assert.equal(empty.status, 'ready')
  assert.deepEqual(empty.guides, [])
  for (const fetch of [async () => new Response('{"message":"unavailable"}', { status: 503 }), async () => { throw new Error('offline') }]) {
    const result = await loadIntegrationGuides(client(fetch))
    assert.equal(result.status, 'unavailable')
    assert.deepEqual(result.guides, [])
  }
})

test('integration service page has a distinct canonical, sitemap entry and bidirectional discovery', () => {
  const page = readFileSync(new URL('../app/integration-support/page.tsx', import.meta.url), 'utf8')
  const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8')
  assert.match(page, /canonical: '\/integration-support'/)
  assert.ok(sitemap.includes('${SITE_URL}/integration-support'))
  assert.match(page, /href="\/resources\/integration-basics"/)
  assert.equal(getResource('integration-basics')?.nextStep?.href, '/integration-support')
  assert.equal(new URL(INTEGRATION_DIRECTORY_HREF, 'https://directory.test').searchParams.get('modality'), 'Integration conversations')
  assert.match(page, /not a confirmed service area/)
  assert.match(page, /not verified availability/)
  assert.match(page, /diagnoses, medication lists, trauma details and substance use history/)
})
