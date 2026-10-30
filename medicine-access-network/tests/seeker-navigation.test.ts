import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createFormControl } from 'react-hook-form'
import { parseFacilitatorFilters } from '../lib/facilitator-search'
import { profileSupportOptions } from '../lib/contact-options'
import { discoveryReturnHref, directorySupportIntent, profileDiscoveryHref, initialSupportSelection, INTEGRATION_SERVICE } from '../lib/seeker-navigation'

const integrationFilters = parseFacilitatorFilters(new URLSearchParams({ modality: INTEGRATION_SERVICE }))

test('filtered directory round trip preserves query, location, filters, sort and current page', () => {
  const original = '/facilitators?q=Ash+%26+Jo&location=New+York&modality=Integration+conversations&remote=true&donation=true&min_exp=3&sort=name&page=2'
  const normalized = discoveryReturnHref(original)
  assert.equal(normalized, original)
  const profile = new URL(profileDiscoveryHref('guide-id', original, directorySupportIntent(integrationFilters)), 'https://site.test')
  assert.equal(profile.pathname, '/facilitators/guide-id')
  assert.equal(discoveryReturnHref(profile.searchParams.get('returnTo')), original)
  assert.equal(profile.searchParams.get('service'), INTEGRATION_SERVICE)
  // Opening again, Back and Forward preserve the same URLs; all-guides remains explicit.
  assert.equal(profileDiscoveryHref('guide-id', normalized!, profile.searchParams.get('service')!), profile.pathname + profile.search)
  assert.equal(discoveryReturnHref('/facilitators'), '/facilitators')
})

test('return target rejects external, encoded, normalized, private and ambiguous destinations', () => {
  for (const input of [undefined, null, [], ['https://evil.test'], 'https://evil.test/facilitators', '//evil.test/facilitators', '/\\evil.test', '/facilitators\\x', '/%2ffacilitators', '/%66acilitators', '/x/../facilitators', '/facilitators/../admin', '/admin', '/login', '/facilitators/guide-id', '/facilitators#x', '/integration-support?next=//evil.test', '/facilitators\n', '/facilitators\u0000', '/facilitators?' + 'q='.repeat(1100)]) {
    assert.equal(discoveryReturnHref(input), null, String(input))
  }
  assert.equal(discoveryReturnHref('/facilitators?next=https://evil.test&returnTo=//evil.test&sort=invalid&page=-1'), '/facilitators')
  assert.equal(discoveryReturnHref('/facilitators?modality=not-a-service&token=secret'), '/facilitators')
  assert.equal(discoveryReturnHref('/integration-support'), '/integration-support')
  assert.equal(profileDiscoveryHref('guide-id', '//evil.test', 'unrelated'), '/facilitators/guide-id')
})

test('only explicit single integration intent is carried, never inferred from a name/query or unrelated filters', () => {
  assert.equal(directorySupportIntent(integrationFilters), INTEGRATION_SERVICE)
  assert.equal(directorySupportIntent(parseFacilitatorFilters(new URLSearchParams({ modality: 'Psychedelic Integration' }))), INTEGRATION_SERVICE)
  for (const query of ['q=integration', '', 'modality=Breathwork', 'modality=Integration+conversations&modality=Spiritual+support']) {
    assert.equal(directorySupportIntent(parseFacilitatorFilters(new URLSearchParams(query))), undefined)
  }
  assert.equal(profileDiscoveryHref('guide-id'), '/facilitators/guide-id')
  assert.equal(initialSupportSelection(undefined, [INTEGRATION_SERVICE]), '')
  assert.equal(initialSupportSelection(INTEGRATION_SERVICE, ['Spiritual support']), '')
  assert.equal(initialSupportSelection(INTEGRATION_SERVICE, ['Integration Coaching']), INTEGRATION_SERVICE)
  assert.equal(initialSupportSelection([INTEGRATION_SERVICE], [INTEGRATION_SERVICE]), '')
  assert.equal(initialSupportSelection('Spiritual support', ['Spiritual support']), '')
})

const formSource = readFileSync(new URL('../components/forms/ContactRequestForm.tsx', import.meta.url), 'utf8')
function actualDefaults(service: string, modalities: string[]) {
  const source = ts.createSourceFile('ContactRequestForm.tsx', formSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let defaults: Record<string, string> | undefined
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useForm') {
      const config = node.arguments[0] as ts.ObjectLiteralExpression
      const property = config.properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(source) === 'defaultValues') as ts.PropertyAssignment
      defaults = new Function('facilitatorProfileId', 'supportOptions', 'initialService', `return (${property.initializer.getText(source)})`)('guide-id', profileSupportOptions(modalities), service)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(defaults)
  return defaults
}

test('actual inquiry defaults preselect supported integration only and leave all private fields blank', () => {
  const defaults = actualDefaults(INTEGRATION_SERVICE, [INTEGRATION_SERVICE])
  assert.equal(defaults.requested_service, INTEGRATION_SERVICE)
  for (const field of ['seeker_name', 'seeker_email', 'message', 'preferred_time_window']) assert.equal(defaults[field], '')
  assert.equal(actualDefaults('', [INTEGRATION_SERVICE]).requested_service, '')
  assert.equal(actualDefaults(INTEGRATION_SERVICE, ['Spiritual support']).requested_service, '')
})

test('visitor edits survive repeated hint evaluation and closing/reopening details without a reset', () => {
  const control = createFormControl({ defaultValues: actualDefaults(INTEGRATION_SERVICE, [INTEGRATION_SERVICE, 'Spiritual support']) })
  control.register('requested_service')
  control.setValue('requested_service', 'Spiritual support', { shouldDirty: true })
  // Evaluating defaults alone cannot mutate a draft. The component effect is
  // separately exercised by inquiry-intent-lifecycle.test.ts with persisted edits.
  actualDefaults(INTEGRATION_SERVICE, [INTEGRATION_SERVICE, 'Spiritual support'])
  assert.equal(control.control._formValues.requested_service, 'Spiritual support')
  assert.equal(control.getFieldState('requested_service').isDirty, true)
  assert.doesNotMatch(formSource, /\breset\s*\(/)
  assert.match(formSource, /if \(!serviceEdited.current\) setValue\('requested_service', serviceHint/)
  const details = readFileSync(new URL('../components/profile/ProfileDetails.tsx', import.meta.url), 'utf8')
  assert.match(details, /<details/)
  assert.match(details, /\{children\}/) // native disclosure keeps the form mounted, including closing/canceling
  const page = readFileSync(new URL('../app/facilitators/[id]/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /key=\{facilitator.id\}/) // a different guide gets a fresh form, not the previous visitor draft
})

test('early integration link preserves final CTA and analytics continue discarding URL query values', () => {
  const article = readFileSync(new URL('../app/resources/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.ok(article.indexOf('Ready to compare approaches?') < article.indexOf('resource.blocks.map'))
  assert.match(article, /slug === 'integration-basics'/)
  assert.match(article, /resource.nextStep/)
  const analytics = readFileSync(new URL('../components/TrafficAnalytics.tsx', import.meta.url), 'utf8')
  assert.match(analytics, /url.search = ""/)
  assert.match(analytics, /url.hash = ""/)
  assert.doesNotMatch(formSource, /recordEngagement\([^)]*(returnTo|initialService)/)
})

test('every actual card link carries the same context, including photo, name, service and View', async () => {
  const { createRequire } = await import('node:module')
  const { createElement } = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const navigation = await import('../lib/seeker-navigation')
  const constants = await import('../lib/constants')
  const require = createRequire(import.meta.url)
  const passthrough = ({ children }: { children: React.ReactNode }) => children
  const mocks: Record<string, unknown> = {
    'next/link': { __esModule: true, default: ({ children, ...props }: Record<string, unknown>) => createElement('a', props, children as React.ReactNode) },
    '@/lib/seeker-navigation': navigation,
    '@/lib/constants': constants,
    '@/lib/profile-media': { getProfileImageUrl: () => null },
    '@/components/i18n/TranslationProvider': { useTranslation: () => ({ t: (value: string) => value }) },
    '@/components/ui/avatar': { Avatar: passthrough, AvatarFallback: passthrough, AvatarImage: () => null },
    './provider-row.module.css': { __esModule: true, default: {} },
  }
  const code = ts.transpileModule(readFileSync(new URL('../components/cards/FacilitatorCard.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const loaded = { exports: {} as { FacilitatorCard: React.ComponentType<Record<string, unknown>> } }
  new Function('require', 'module', 'exports', code)((name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports)
  const returnTo = '/facilitators?modality=Integration+conversations&sort=name&page=2'
  const html = renderToStaticMarkup(createElement(loaded.exports.FacilitatorCard, {
    facilitator: { id: 'guide-id', display_name: 'Example Guide', modalities: [INTEGRATION_SERVICE], location: null },
    returnTo, service: INTEGRATION_SERVICE,
  }))
  const links = [...html.matchAll(/href="([^"]*)"/g)].map(match => match[1].replaceAll('&amp;', '&'))
  assert.equal(links.length, 4)
  assert.ok(links.every(href => href === profileDiscoveryHref('guide-id', returnTo, INTEGRATION_SERVICE)))
})
