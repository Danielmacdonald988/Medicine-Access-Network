import assert from 'node:assert/strict'
import test from 'node:test'
import { commonMessages } from '../lib/i18n/messages/common'
import { discoveryMessages } from '../lib/i18n/messages/discovery'
import { directoryMessages } from '../lib/i18n/messages/directory'
import { accountsMessages } from '../lib/i18n/messages/accounts'
import { dashboardMessages } from '../lib/i18n/messages/dashboards'
import { resourceMessages } from '../lib/i18n/messages/resources'
import { platformMessages } from '../lib/i18n/messages/platform'
import { MODALITIES, MODALITY_CATEGORIES } from '../lib/constants'
import { textSearchExpression, parseFacilitatorFilters, filterSearchParams } from '../lib/facilitator-search'
import { createTranslator, dictionaryFor, LOCALES, type MessageCatalog } from '../lib/i18n/config'

const catalogs: MessageCatalog[] = [commonMessages, resourceMessages, platformMessages, discoveryMessages, directoryMessages, accountsMessages, dashboardMessages]
const placeholders = (text: string) => [...new Set(text.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) ?? [])].sort()

test('every supported translation preserves required dynamic values', () => {
  for (const catalog of catalogs) for (const [key, translations] of Object.entries(catalog)) {
    assert.equal(translations.length, 9, key)
    for (const [index, translation] of translations.entries()) {
      assert.ok(translation.trim(), `${LOCALES[index + 1]}: ${key}`)
      assert.deepEqual(placeholders(translation), placeholders(key), `${LOCALES[index + 1]}: ${key}`)
    }
  }
})

test('every localized modality and category finds its canonical database records', () => {
  for (const locale of LOCALES.slice(1)) {
    const dictionary = dictionaryFor(locale, catalogs)
    const t = createTranslator(dictionary)
    for (const modality of MODALITIES) {
      const translated = t(modality.name)
      assert.ok(Object.hasOwn(dictionary, modality.name), `${locale}: ${modality.name}`)
      assert.ok(textSearchExpression(translated).includes(modality.name), `${locale}: ${translated}`)
    }
    for (const [category, label] of Object.entries(MODALITY_CATEGORIES)) {
      const expression = textSearchExpression(t(label))
      for (const modality of MODALITIES.filter((item) => item.category === category)) {
        assert.ok(expression.includes(modality.name), `${locale}: ${label} -> ${modality.name}`)
      }
    }
  }
})

test('translated free text expands supported practices without replacing entered words or canonical filters', () => {
  const query = 'INTEGRACIÓN'
  const filters = parseFacilitatorFilters(new URLSearchParams({ q: query, modality: 'Breathwork', location: 'México', remote: 'true' }))
  const expression = textSearchExpression(filters.q)
  assert.ok(expression.includes('Integration Coaching'))
  assert.ok(expression.includes('bio.imatch."INTEGRACIÓN"'))
  assert.deepEqual([...filterSearchParams(filters)], [['q', query], ['location', 'México'], ['modality', 'Breathwork'], ['remote', 'true']])
  assert.equal(textSearchExpression('Example Name 123').includes('modalities.ov.'), false)
  assert.equal(textSearchExpression('private.person@example.com').includes('modalities.ov.'), false)
})
