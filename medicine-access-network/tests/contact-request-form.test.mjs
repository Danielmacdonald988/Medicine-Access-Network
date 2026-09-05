import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = new URL('../', import.meta.url)
const formSource = readFileSync(new URL('components/forms/ContactRequestForm.tsx', root), 'utf8')
const schemaSource = readFileSync(new URL('lib/validations.ts', root), 'utf8')
const schemaModule = { exports: {} }
const schemaCode = ts.transpileModule(schemaSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
new Function('require', 'module', 'exports', schemaCode)(require, schemaModule, schemaModule.exports)
const { contactRequestFormSchema, contactRequestSchema } = schemaModule.exports

// Read the actual form configuration. Duplicating the defaults in the test
// would miss the missing hidden profile id that originally blocked submission.
function actualFormDefaults(facilitatorProfileId) {
  const source = ts.createSourceFile('ContactRequestForm.tsx', formSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let defaults
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useForm') {
      const config = node.arguments[0]
      if (config && ts.isObjectLiteralExpression(config)) {
        const property = config.properties.find((item) => ts.isPropertyAssignment(item) && item.name.getText(source) === 'defaultValues')
        if (property) defaults = new Function('facilitatorProfileId', `return (${property.initializer.getText(source)})`)(facilitatorProfileId)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.ok(defaults, 'ContactRequestForm should supply useForm defaultValues')
  return defaults
}

const guideId = 'd83e7d80-e6fa-4528-a981-f088343cb29a'
const completedFields = {
  seeker_name: 'Example Visitor',
  seeker_email: 'visitor@example.com',
  requested_service: 'Integration coaching',
  preferred_format: 'video',
  message: 'I would like to discuss integration support and your availability.',
  ack_safety: true,
}

test('the actual contact form defaults allow submission after visible fields are completed', () => {
  const result = contactRequestFormSchema.safeParse({ ...actualFormDefaults(guideId), ...completedFields })
  assert.equal(result.success, true)
  assert.equal(result.data.facilitator_profile_id, guideId)
  const payload = contactRequestSchema.parse(result.data)
  assert.equal(payload.facilitator_profile_id, guideId)
  assert.equal('ack_safety' in payload, false)
  assert.equal('seeker_id' in payload, false)
})

test('blank form validation only requires fields the visitor can edit', () => {
  const result = contactRequestFormSchema.safeParse(actualFormDefaults(guideId))
  assert.equal(result.success, false)
  const visibleFields = new Set(['seeker_name', 'seeker_email', 'requested_service', 'preferred_format', 'message', 'ack_safety'])
  for (const issue of result.error.issues) {
    assert.ok(visibleFields.has(issue.path[0]), `Hidden field would silently block submission: ${issue.path[0]}`)
  }
})

test('a completed message still requires the safety acknowledgement and a valid profile id', () => {
  const value = { ...actualFormDefaults(guideId), ...completedFields }
  assert.equal(contactRequestFormSchema.safeParse({ ...value, ack_safety: false }).success, false)
  assert.equal(contactRequestFormSchema.safeParse({ ...value, facilitator_profile_id: 'invalid' }).success, false)
})
