import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { badgeEmbedCode, initialsFor, storyServices, suggestedCaption, profileUrl, BADGE_PATH } from '../lib/share-kit'
import { SITE_URL } from '../lib/constants'

const id = '00000000-0000-4000-8000-000000000001'

test('badge code links the guide profile and the hosted badge', () => {
  const code = badgeEmbedCode(id)
  assert.match(code, new RegExp(`href="${SITE_URL}/facilitators/${id}"`))
  assert.match(code, new RegExp(`src="${SITE_URL}${BADGE_PATH}"`))
  assert.match(code, /alt="Listed on The Facilitator Network"/)
  assert.ok(readFileSync(`public${BADGE_PATH}`, 'utf8').includes('The Facilitator Network'))
})

test('story shows at most three current service names and never a dropped legacy label', () => {
  assert.deepEqual(storyServices(null), [])
  assert.ok(storyServices(['Integration Coaching', 'Breathwork', 'Somatic practices', 'Meditation & mindfulness', 'Spiritual support']).length <= 3)
  assert.equal(storyServices(['Kambo Education']).length, 0)
})

test('initials fall back safely', () => {
  assert.equal(initialsFor('Jane Savina Gardner'), 'JS')
  assert.equal(initialsFor('  '), '?')
})

test('share copy makes no outcome, verification or substance claims', () => {
  const copy = [suggestedCaption(id), readFileSync('app/facilitators/[id]/story/route.tsx', 'utf8'), readFileSync('components/dashboard/SharePanel.tsx', 'utf8')].join('\n')
  assert.ok(suggestedCaption(id).includes(profileUrl(id)))
  assert.doesNotMatch(copy, /\b(heals?|healing|cures?|guaranteed|verified guide|certified by|dos(e|es|ing)|ceremon(y|ies)|trip)\b/i)
})

test('story route only reads the public projection and is never publicly cached', () => {
  const route = readFileSync('app/facilitators/[id]/story/route.tsx', 'utf8')
  assert.match(route, /from\('facilitator_public_profiles'\)/)
  assert.doesNotMatch(route, /from\('facilitator_profiles'\)/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
})
