import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { CURRENT_AGREEMENT_VERSION } from '../lib/agreement'
import { facilitatorOnboardingSchema } from '../lib/validations'

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('the app, the database and the legal pages agree on the version that publishes a bio', () => {
  assert.equal(CURRENT_AGREEMENT_VERSION, '2026-11-11.1')
  const schema = read('db/schema.sql')
  for (const name of ['20261111201500_public_bio_opt_in.sql', '20261111213000_publish_existing_bios.sql']) {
    assert.ok(schema.includes(read(`db/migrations/${name}`)), `consolidated schema includes ${name} verbatim`)
  }
  // The latest projection rule publishes every approved bio unless withheld.
  assert.match(read('db/migrations/20261111213000_publish_existing_bios.sql'), /case when not new\.bio_withheld then new\.bio end/)
  assert.ok(schema.lastIndexOf('case when not new.bio_withheld then new.bio end') > schema.lastIndexOf("case when new.agreement_version='2026-11-11.1'"))
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

test('new submissions accept only the current agreement version', () => {
  assert.equal(facilitatorOnboardingSchema.shape.agreement_version.safeParse('2026-09-27.1').success, false)
  assert.equal(facilitatorOnboardingSchema.shape.agreement_version.safeParse('2026-11-11.1').success, true)
})

test('legal wording, the form and the profile tell guides and visitors the same thing', () => {
  const privacy = read('app/privacy/page.tsx')
  const agreement = read('app/provider-agreement/page.tsx')
  assert.match(agreement, /Your biography is published on your approved listing/)
  assert.match(privacy, /chosen contact\/social links, and the biography they wrote\./)
  assert.doesNotMatch(privacy + agreement, /earlier (agreement )?version[^.]*not published/)
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
  assert.match(read('app/admin/page.tsx'), /f\.bio_withheld \?/)
})
