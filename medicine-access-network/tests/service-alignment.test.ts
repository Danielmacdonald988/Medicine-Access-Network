import assert from 'node:assert/strict'
import test from 'node:test'
import { MODALITIES, profileServices, serviceSearchNames } from '../lib/constants'
import { normalizeSocialUrl, socialUrlSchema } from '../lib/social-links'

test('legacy selections merge into signup labels without adding unselected categories', () => {
  const result = profileServices(['Preparation Coaching', 'Ceremony Preparation', 'Psychedelic Integration', 'Kambo Education'])
  assert.deepEqual(result, ['Integration conversations', 'Preparation education'])
  assert(result.every(name => MODALITIES.some(item => item.name === name)))
  assert.deepEqual(profileServices(result), result)
  assert(serviceSearchNames(['Preparation education']).includes('Ceremony Preparation'))
  assert(!serviceSearchNames(['Harm-reduction education']).includes('Kambo Education'))
})

test('social links allow real HTTPS profile routes and reject deceptive or executable URLs', () => {
  assert.equal(normalizeSocialUrl('instagram_url','https://www.instagram.com/example/'),'https://www.instagram.com/example/')
  for (const value of ['javascript:alert(1)','https://instagram.com.evil.test/user','https://user:pass@instagram.com/user','http://instagram.com/user','https://instagram.com/']) {
    assert.equal(normalizeSocialUrl('instagram_url', value),null)
    assert.equal(socialUrlSchema('instagram_url').safeParse(value).success,false)
  }
  assert.equal(socialUrlSchema('website_url').parse(''),null)
  assert.equal(normalizeSocialUrl('website_url','https://example.com/about'),'https://example.com/about')
})
