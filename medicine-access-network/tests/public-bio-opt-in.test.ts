import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { CURRENT_AGREEMENT_VERSION, PUBLIC_BIO_AGREEMENT_VERSION, bioIsPublicUnder } from '../lib/agreement'
import { facilitatorOnboardingSchema } from '../lib/validations'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('the app, the database and the legal pages agree on the version that publishes a bio', () => {
  assert.equal(CURRENT_AGREEMENT_VERSION, '2026-11-11.1')
  assert.equal(PUBLIC_BIO_AGREEMENT_VERSION, CURRENT_AGREEMENT_VERSION)
  const migration = read('db/migrations/20261111201500_public_bio_opt_in.sql')
  assert.match(migration, /case when new\.agreement_version='2026-11-11\.1' and new\.agreement_accepted_at is not null then new\.bio end/)
  assert.ok(read('db/schema.sql').includes(migration), 'consolidated schema includes the migration verbatim')
  for (const page of ['app/privacy/page.tsx', 'app/provider-agreement/page.tsx']) {
    const current = read(page)
    assert.match(current, /Version 2026-11-11\.1/)
    assert.match(current, /Earlier version 2026-09-27\.1/)
    const archived = read(page.replace('app/', 'app/legal/2026-11-11.1/'))
    assert.match(archived, /canonical: "\/legal\/2026-11-11\.1\//)
    assert.equal(archived.replace(/canonical: "[^"]+"/, ''), current.replace(/canonical: "[^"]+"/, ''), 'archived copy has the same wording')
    // The version guides accepted before must stay available unchanged.
    assert.match(read(page.replace('app/', 'app/legal/2026-09-27.1/')), /Version 2026-09-27\.1/)
  }
})

test('only the consenting agreement version makes a bio public', () => {
  assert.equal(bioIsPublicUnder('2026-11-11.1'), true)
  for (const version of ['2026-09-27.1', '', null, undefined, '2026-11-11.10']) assert.equal(bioIsPublicUnder(version), false)
  assert.equal(facilitatorOnboardingSchema.shape.agreement_version.safeParse('2026-09-27.1').success, false)
  assert.equal(facilitatorOnboardingSchema.shape.agreement_version.safeParse('2026-11-11.1').success, true)
})

test('legal wording, the form and the profile tell guides and visitors the same thing', () => {
  const privacy = read('app/privacy/page.tsx')
  const agreement = read('app/provider-agreement/page.tsx')
  assert.match(agreement, /Your biography is published on your approved listing/)
  assert.match(agreement, /not published until you accept this version and your listing is approved again/)
  assert.match(privacy, /the biography they wrote/)
  for (const text of [privacy, agreement]) {
    assert.match(text, /safety (responses|narratives) are restricted/)
    assert.doesNotMatch(text, /Biography, training narratives|Bios, training descriptions/)
  }
  const form = read('components/forms/FacilitatorOnboardingForm.tsx')
  assert.match(form, /Your bio appears on your public profile once your listing is approved/)
  assert.match(form, /I understand my bio will be shown on my public profile/)
  assert.doesNotMatch(form, /Your bio is for you and our administrators/)
  const profile = read('app/facilitators/[id]/page.tsx')
  assert.match(profile, /Written by the guide\. Self-reported and not verified by The Facilitator Network\./)
  // Restricted narratives must never be requested for a public page.
  for (const file of ['app/facilitators/[id]/page.tsx', 'lib/facilitator-search.ts', 'components/cards/FacilitatorCard.tsx']) {
    assert.doesNotMatch(read(file), /lineage_or_training|safety_practices|certifications/)
  }
  assert.match(read('app/admin/page.tsx'), /bioIsPublicUnder\(f\.agreement_version\)/)
})
