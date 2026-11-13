import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import ts from 'typescript'
import { facilitatorSearchRecovery } from '../lib/facilitator-search-recovery'
import { directoryHref, filterSearchParams, hasActiveFilters, parseFacilitatorFilters, textSearchExpression, type FacilitatorFilters } from '../lib/facilitator-search'

const filters = (query: string) => parseFacilitatorFilters(new URLSearchParams(query))

test('only the exact broad facilitator phrase offers an explicit first-page recovery', () => {
  for (const q of ['psychedelic facilitator', 'psychedelic facilitators', '  PSYCHEDELIC   FACILITATOR  ']) {
    const input = filters(`q=${encodeURIComponent(q)}`)
    assert.equal(facilitatorSearchRecovery(input, 1).length, 2)
    assert.deepEqual(facilitatorSearchRecovery(input, 2), [])
  }
  for (const q of ['', 'integration support', 'psychedelic therapist', 'psychedelic facilitator Boston', 'psychedelic facilitator?', 'constructor', '__proto__']) {
    assert.deepEqual(facilitatorSearchRecovery(filters(`q=${encodeURIComponent(q)}`), 1), [])
  }
})

test('recovery uses existing support categories and preserves practical preferences without mutating the search', () => {
  const input = filters('q=psychedelic+facilitator&location=Boston%2C+MA&remote=true&donation=true&min_exp=5&sort=name&modality=Breathwork&modality=Spiritual+support&page=9')
  const before = structuredClone(input)
  const alternatives = facilitatorSearchRecovery(input, 1)
  assert.deepEqual(alternatives.map(item => item.label), ['Browse preparation support', 'Browse integration support'])
  for (const [index, { href }] of alternatives.entries()) {
    const url = new URL(href, 'https://example.test')
    assert.equal(url.origin, 'https://example.test')
    assert.equal(url.pathname, '/facilitators')
    assert.equal(url.searchParams.has('q'), false)
    assert.equal(url.searchParams.has('page'), false)
    assert.deepEqual(parseFacilitatorFilters(url.searchParams), {
      ...input,
      q: '',
      modalities: [index === 0 ? 'Preparation education' : 'Integration conversations'],
    })
  }
  assert.deepEqual(input, before)
})

test('plain recovery never adds location, format, pricing, experience or ranking assumptions', () => {
  for (const { href } of facilitatorSearchRecovery(filters('q=psychedelic+facilitator'), 1)) {
    const params = new URL(href, 'https://example.test').searchParams
    assert.deepEqual([...params.keys()], ['modality'])
  }
  // Recovery does not silently expand this phrase into service matches.
  assert.equal(textSearchExpression('psychedelic facilitator').includes('modalities.ov.'), false)
})

test('special characters in retained preferences remain query data, not destinations', () => {
  const location = 'Boston & q=private # / https://other.example'
  const input = filters(`q=psychedelic+facilitator&location=${encodeURIComponent(location)}`)
  for (const { href } of facilitatorSearchRecovery(input, 1)) {
    const url = new URL(href, 'https://example.test')
    assert.equal(url.origin, 'https://example.test')
    assert.equal(url.hash, '')
    assert.equal(url.searchParams.get('location'), location)
    assert.equal(url.searchParams.has('q'), false)
  }
})

test('recovery appears only in empty results, keeps scope truthful and labels English copy', () => {
  const source = readFileSync('app/facilitators/page.tsx', 'utf8')
  const emptyResults = source.slice(source.indexOf('async function EmptyResults'), source.indexOf('async function ActiveFilters'))
  assert.match(emptyResults, /facilitatorSearchRecovery\(filters, page\)/)
  assert.match(emptyResults, /alternatives.length \? <nav lang="en"/)
  assert.match(emptyResults, /not substance administration/)
  assert.match(emptyResults, /matching guides may not be available/)
  assert.match(emptyResults, /href=\{href\} className="[^"]*min-h-11/)
  assert.match(emptyResults, /focus-visible:outline/)
  assert.match(emptyResults, /Clear search and filters/)
  assert.match(source, /if \(!facilitators.length\) return[\s\S]*?<EmptyResults filters=\{filters\} page=\{page\}/)
})

// Render the actual empty-results function, not a duplicate of its markup.
// Only framework primitives and the unrelated resource footer are replaced.
async function renderEmptyResults(input: FacilitatorFilters, page = 1) {
  const source = ts.createSourceFile('page.tsx', readFileSync('app/facilitators/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'EmptyResults')
  assert.ok(declaration)
  const compiled = ts.transpileModule(`export ${declaration.getText(source)}`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports: { EmptyResults?: (props: { filters: FacilitatorFilters; page: number }) => Promise<ReactNode> } = {}
  new Function('require', 'exports', 'getTranslation', 'hasActiveFilters', 'directoryHref', 'filterSearchParams', 'facilitatorSearchRecovery', 'SlidersHorizontal', 'Users', 'Link', 'Button', 'SupportResources', compiled)(
    createRequire(import.meta.url), exports, async () => ({ t: (value: string) => value }), hasActiveFilters, directoryHref, filterSearchParams, facilitatorSearchRecovery,
    'svg', 'svg', 'a', ({ children }: { children: ReactNode }) => children, () => null,
  )
  assert.ok(exports.EmptyResults)
  return renderToStaticMarkup(await exports.EmptyResults({ filters: input, page }))
}

test('actual empty-result markup offers two scoped alternatives while keeping clear-search recovery', async () => {
  const html = await renderEmptyResults(filters('q=psychedelic+facilitator&remote=true&sort=name'))
  assert.match(html, /No guides match your search yet/)
  assert.match(html, /<nav lang="en" aria-label="Explore listed support instead"/)
  assert.match(html, /href="\/facilitators\?remote=true&amp;modality=Preparation\+education&amp;sort=name"|href="\/facilitators\?remote=true&amp;sort=name&amp;modality=Preparation\+education"/)
  assert.match(html, /Browse preparation support/)
  assert.match(html, /Browse integration support/)
  assert.match(html, /not substance administration/)
  assert.match(html, /Clear search and filters/)
  assert.doesNotMatch(html, /Try removing a filter/)
})

test('actual other-empty and later-page markup retain their existing recovery', async () => {
  const ordinary = await renderEmptyResults(filters('q=unmatched+name'))
  assert.match(ordinary, /Try removing a filter/)
  assert.doesNotMatch(ordinary, /Explore listed support instead/)
  const later = await renderEmptyResults(filters('q=psychedelic+facilitator&remote=true'), 2)
  assert.match(later, /Back to first page/)
  assert.match(later, /q=psychedelic\+facilitator&amp;remote=true/)
  assert.doesNotMatch(later, /Explore listed support instead/)
})
