import assert from 'node:assert/strict'
import test from 'node:test'
import { getResource } from '../lib/resources'

const content = (slug: string) => JSON.stringify(getResource(slug)?.blocks)

test('scope guidance distinguishes jurisdiction-dependent credentials without therapy stereotypes', () => {
  const scope = content('scope-of-practice')
  assert.match(scope, /vary by jurisdiction/)
  assert.match(scope, /title alone does not establish a license/)
  assert.doesNotMatch(scope, /Often past-oriented|No protected title|are trained and licensed to assess/)
  const sources = getResource('scope-of-practice')?.sourceCheck
  assert.equal(sources?.date, '2026-11-08')
  assert.equal(sources?.sources.length, 2)
})

test('preparation and scope avoid promising legality of listed services', () => {
  for (const slug of ['preparation-basics', 'scope-of-practice']) {
    assert.doesNotMatch(content(slug), /Guides here offer legal|related legal wellness/)
    assert.match(content(slug), /does not (independently )?verify service legality/)
  }
})

test('red flags do not make unsupported prevalence or safety guarantees', () => {
  assert.doesNotMatch(content('red-flags'), /Most guides|Knowing what to look for protects you/)
  assert.match(content('red-flags'), /cannot guarantee safety/)
})
