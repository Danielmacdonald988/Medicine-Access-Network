import assert from 'node:assert/strict'
import test from 'node:test'
import { createTranslator, dictionaryFor, languagePreference, LOCALES, resolveLocale, type MessageCatalog } from '../lib/i18n/config'

test('a saved language overrides the browser without accepting arbitrary cookie values', () => {
  assert.equal(resolveLocale('en', 'es-MX,es;q=0.9'), 'en')
  assert.equal(resolveLocale('ja', 'en-US,en;q=0.9'), 'ja')
  for (const invalid of ['auto', 'unknown', '__proto__', '../es', '', undefined]) {
    assert.equal(resolveLocale(invalid, 'fr-CA,fr;q=0.9'), 'fr')
    assert.equal(languagePreference(invalid), 'auto')
  }
})

test('browser matching respects regional tags, preference order and quality weights', () => {
  assert.equal(resolveLocale('auto', 'es-MX,es;q=0.9,en;q=0.8'), 'es')
  assert.equal(resolveLocale('auto', 'pt-BR,pt;q=0.9'), 'pt')
  assert.equal(resolveLocale('auto', 'zh-Hans-CN,zh;q=0.8'), 'zh-CN')
  assert.equal(resolveLocale('auto', 'fr;q=0.5,de-AT;q=0.9'), 'de')
  assert.equal(resolveLocale('auto', 'it;q=0.8,nl;q=0.8'), 'it')
  assert.equal(resolveLocale('auto', 'ar,ko-KR;q=0.8,en;q=0.5'), 'ko')
})

test('excluded or malformed browser languages cannot win language negotiation', () => {
  assert.equal(resolveLocale('auto', 'es;q=0,ja;q=0.5'), 'ja')
  assert.equal(resolveLocale('auto', 'es;q=2,fr;q=NaN,it;q=0.8'), 'it')
  assert.equal(resolveLocale('auto', 'es_MX,de;q=0.7'), 'de')
  assert.equal(resolveLocale('auto', null), 'en')
  assert.equal(resolveLocale('auto', 'ar,ru;q=0.9'), 'en')
})

test('catalogs select only the visitor language and keep untranslated text intact', () => {
  const messages: MessageCatalog = { Hello: ['Hola', 'Bonjour', 'Olá', 'Hallo', 'Ciao', 'Hallo', '你好', 'こんにちは', '안녕하세요'] }
  assert.deepEqual(dictionaryFor('en', [messages]), {})
  for (const [index, locale] of LOCALES.slice(1).entries()) {
    const dictionary = dictionaryFor(locale, [messages])
    assert.deepEqual(dictionary, { Hello: messages.Hello[index] })
    assert.equal(createTranslator(dictionary)('Author-written biography'), 'Author-written biography')
  }
})

test('interpolation preserves authored values literally without recursive replacement', () => {
  const t = createTranslator({ 'Contact {name}': 'Contactar con {name}', 'From {amount}': 'Desde {amount}' })
  assert.equal(t('Contact {name}', { name: 'Dan {amount} <script>' }), 'Contactar con Dan {amount} <script>')
  assert.equal(t('From {amount}', { amount: 0 }), 'Desde 0')
  assert.equal(t('Contact {name}'), 'Contactar con {name}')
  assert.equal(t('constructor'), 'constructor')
})
