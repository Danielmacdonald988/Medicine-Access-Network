import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { createTranslator, dictionaryFor } from '../lib/i18n/config'
import { directoryMessages } from '../lib/i18n/messages/directory'
import { discoveryMessages } from '../lib/i18n/messages/discovery'
import * as contactOptions from '../lib/contact-options'
import * as validations from '../lib/validations'

const require = createRequire(import.meta.url)

test('Spanish contact options display translated labels while retaining canonical selected values', () => {
  const t = createTranslator(dictionaryFor('es', [directoryMessages, discoveryMessages]))
  const values = {
    facilitator_profile_id: '11111111-1111-4111-8111-111111111111',
    seeker_name: 'Test Visitor',
    seeker_email: 'visitor@example.test',
    requested_service: 'Integration Coaching',
    preferred_format: 'video',
    preferred_time_window: 'Weekday mornings',
    message: 'Me gustaría conocer su enfoque y disponibilidad.',
    ack_safety: true,
  }
  const element = (tag: string) => function NativeControl({ children, ...props }: Record<string, unknown>) { return createElement(tag, props, children as React.ReactNode) }
  const childrenOnly = ({ children }: { children: React.ReactNode }) => children
  const mocks: Record<string, unknown> = {
    '@/components/i18n/TranslationProvider': { useTranslation: () => ({ locale: 'es', t }) },
    '@/lib/contact-options': contactOptions,
    '@/lib/validations': validations,
    '@/lib/utils': { cn: (...classes: string[]) => classes.filter(Boolean).join(' ') },
    'next/link': { __esModule: true, default: element('a') },
    'react-hook-form': {
      useForm: () => ({
        register: (name: string) => ({ name }),
        handleSubmit: () => () => undefined,
        control: values,
        formState: { errors: {}, isSubmitting: false },
      }),
      Controller: ({ name, render }: { name: keyof typeof values; render: (value: unknown) => React.ReactNode }) => render({ field: { value: values[name], onChange() {}, onBlur() {} } }),
    },
    '@/components/ui/button': { Button: element('button') },
    '@/components/ui/input': { Input: element('input') },
    '@/components/ui/textarea': { Textarea: element('textarea') },
    '@/components/ui/label': { Label: element('label') },
    '@/components/ui/checkbox': { Checkbox: () => null },
    // Native controls make the rendered value/label contract observable without
    // depending on the popup library's portal implementation or a real browser.
    '@/components/ui/select': {
      Select: ({ value, children }: { value: string; children: React.ReactNode }) => createElement('select', { value, onChange() {} }, children),
      SelectTrigger: childrenOnly,
      SelectContent: childrenOnly,
      SelectValue: () => null,
      SelectItem: element('option'),
    },
  }
  const source = readFileSync(new URL('../components/forms/ContactRequestForm.tsx', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText
  const loaded = { exports: {} as { ContactRequestForm: React.ComponentType<Record<string, unknown>> } }
  new Function('require', 'module', 'exports', code)((name: string) => name in mocks ? mocks[name] : require(name), loaded, loaded.exports)
  const html = renderToStaticMarkup(createElement(loaded.exports.ContactRequestForm, {
    facilitatorProfileId: values.facilitator_profile_id,
    facilitatorDisplayName: 'Example Guide',
    modalities: ['Integration Coaching'],
    remoteAvailable: true,
    location: 'México',
  }))
  assert.match(html, /value="Integration Coaching" selected=""/)
  assert.match(html, /value="video" selected=""/)
  assert.match(html, /value="Weekday mornings" selected=""/)
  assert.ok(html.includes(t('Integration Coaching')))
  assert.ok(html.includes(t('Weekday mornings')))
  assert.ok(!html.includes(`value="${t('Integration Coaching')}"`))
  assert.ok(!html.includes(`value="${t('Weekday mornings')}"`))
})
