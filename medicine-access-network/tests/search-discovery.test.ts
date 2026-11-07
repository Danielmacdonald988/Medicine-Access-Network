import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import robots from '../app/robots'

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('public photo rendering is allowed while other APIs and private pages stay excluded', () => {
  const previous = process.env.VERCEL_ENV
  try {
    process.env.VERCEL_ENV = 'production'
    const result = robots()
    assert.deepEqual(result.rules, {
      userAgent: '*', allow: ['/', '/api/profile-images/'],
      disallow: ['/api/', '/admin', '/dashboard', '/seeker', '/facilitator$', '/facilitator/', '/onboarding/', '/login', '/signup', '/saved', '/forgot-password', '/update-password', '/auth/'],
    })
    process.env.VERCEL_ENV = 'preview'
    assert.deepEqual(robots().rules, { userAgent: '*', disallow: '/' })
  } finally {
    if (previous === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = previous
  }
  const route = source('app/api/profile-images/[...path]/route.ts')
  assert.match(route, /X-Robots-Tag': 'noindex, nofollow'/)
  assert.match(route, /if \(!allowed\) return missing\(\)/)
  assert.match(route, /facilitator_public_profiles/)
})

test('integration landing page has persistent and contextual discovery links', () => {
  for (const path of ['components/layout/Navbar.tsx', 'components/layout/Footer.tsx', 'app/page.tsx']) {
    assert.match(source(path), /href: "\/integration-support"/)
  }
})
