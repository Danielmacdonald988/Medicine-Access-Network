import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'
import * as contactOptions from '../lib/contact-options'
import * as validations from '../lib/validations'

const require = createRequire(import.meta.url)
const integration = 'Integration conversations'
type Element = { type: unknown; props: Record<string, unknown> }
type Props = { initialService?: string; modalities?: string[] }

// Execute the actual component and its Controller callback with persistent hook
// slots and RHF-like cached defaults. No DOM/portal implementation, fetch or form
// submission is involved. This specifically catches query-only reuse regressions.
function inquiryHarness() {
  const slots: unknown[] = []
  let cursor = 0
  let effects: (() => void)[] = []
  let values: Record<string, unknown> | undefined
  let tree: Element
  const engagements: unknown[][] = []
  const writes: { name: string; value: unknown; options: unknown }[] = []
  const Controller = () => null
  const setValue = (name: string, value: unknown, options: unknown) => {
    writes.push({ name, value, options })
    values![name] = value
  }
  const react = {
    useState: (initial: unknown) => {
      const i = cursor++
      if (!(i in slots)) slots[i] = initial
      return [slots[i], (value: unknown) => { slots[i] = value }]
    },
    useRef: (initial: unknown) => {
      const i = cursor++
      if (!(i in slots)) slots[i] = { current: initial }
      return slots[i]
    },
    useId: () => { cursor++; return 'inquiry-test' },
    useEffect: (effect: () => void, deps: unknown[]) => {
      const i = cursor++
      const previous = slots[i] as unknown[] | undefined
      if (!previous || deps.some((value, index) => !Object.is(value, previous[index]))) effects.push(effect)
      slots[i] = deps
    },
  }
  const mocks: Record<string, unknown> = {
    react,
    '@/lib/engagement-client': { recordEngagement: (...args: unknown[]) => engagements.push(args) },
    '@/components/i18n/TranslationProvider': { useTranslation: () => ({ t: (text: string) => text }) },
    '@/lib/contact-options': contactOptions,
    '@/lib/validations': validations,
    '@/lib/utils': { cn: (...classes: string[]) => classes.filter(Boolean).join(' ') },
    'next/link': { __esModule: true, default: () => null },
    'react-hook-form': {
      Controller,
      useForm: ({ defaultValues }: { defaultValues: Record<string, unknown> }) => {
        values ??= { ...defaultValues }
        return {
          register: (name: string) => ({ name }),
          handleSubmit: () => () => { throw new Error('This test must never submit an inquiry') },
          control: values,
          setValue,
          formState: { errors: {}, isSubmitting: false },
        }
      },
    },
  }
  const source = readFileSync(new URL('../components/forms/ContactRequestForm.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  const loaded = { exports: {} as { ContactRequestForm: (props: Record<string, unknown>) => Element } }
  new Function('require', 'module', 'exports', code)((name: string) => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/components/ui/')) return new Proxy({}, { get: () => () => null })
    return require(name)
  }, loaded, loaded.exports)

  function render(props: Props = {}) {
    cursor = 0
    effects = []
    tree = loaded.exports.ContactRequestForm({
      facilitatorProfileId: '11111111-1111-4111-8111-111111111111',
      facilitatorDisplayName: 'Example Guide',
      remoteAvailable: true,
      modalities: ['Psychedelic Integration', 'Spiritual support'],
      ...props,
    })
    for (const effect of effects) effect()
    return values!
  }
  function findService(node: unknown): Element | undefined {
    if (!node || typeof node !== 'object') return undefined
    if (Array.isArray(node)) {
      for (const child of node) { const found = findService(child); if (found) return found }
      return undefined
    }
    const element = node as Element
    if (element.type === Controller && element.props.name === 'requested_service') return element
    return findService(element.props?.children)
  }
  function chooseService(value: string) {
    const controller = findService(tree)
    assert.ok(controller, 'actual component must render the requested_service Controller')
    const renderControl = controller.props.render as (props: unknown) => Element
    const select = renderControl({ field: {
      value: values!.requested_service,
      onChange: (next: unknown) => { values!.requested_service = next },
      onBlur() {}, ref() {},
    } })
    ;(select.props.onValueChange as (value: string) => void)(value)
    // Model the form's ordinary input-change notification, without passing the
    // selected support, URL, visitor data or return context to analytics.
    ;(tree.props.onChange as () => void)()
  }
  return { render, chooseService, engagements, writes }
}

test('actual inquiry form follows changed route hints only while service is untouched', () => {
  const form = inquiryHarness()
  const draft = form.render()
  assert.equal(draft.requested_service, '')
  draft.message = 'Private draft stays local'
  draft.seeker_email = 'example@example.invalid'
  draft.preferred_format = 'video'
  assert.equal(form.render({ initialService: integration }).requested_service, integration)
  assert.equal(form.render().requested_service, '')
  assert.equal(form.render({ initialService: integration }).requested_service, integration)
  assert.equal(draft.message, 'Private draft stays local')
  assert.equal(draft.seeker_email, 'example@example.invalid')
  assert.equal(draft.preferred_format, 'video')
  assert.ok(form.writes.every(write => write.name === 'requested_service'))
  assert.ok(form.writes.every(write => (write.options as { shouldDirty: boolean }).shouldDirty === false))
  assert.deepEqual(form.engagements, [])
})

test('manual service choice survives later hints, repeated contact opening and unchanged rerenders', () => {
  const form = inquiryHarness()
  assert.equal(form.render({ initialService: integration }).requested_service, integration)
  form.chooseService('Spiritual support')
  const writesAfterEdit = form.writes.length
  for (const props of [{}, { initialService: integration }, { initialService: integration }, {}]) {
    assert.equal(form.render(props).requested_service, 'Spiritual support')
  }
  assert.equal(form.writes.length, writesAfterEdit)
  assert.deepEqual(form.engagements, [['contact_started']])
})

test('unsupported and direct-profile hints stay blank while legacy integration remains supported', () => {
  assert.equal(inquiryHarness().render({ initialService: integration, modalities: ['Spiritual support'] }).requested_service, '')
  assert.equal(inquiryHarness().render({ modalities: ['Psychedelic Integration'] }).requested_service, '')
  assert.equal(inquiryHarness().render({ initialService: integration, modalities: ['Psychedelic Integration'] }).requested_service, integration)
})
