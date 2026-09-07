import { writeFileSync } from 'node:fs'
import { MODALITIES, MODALITY_CATEGORIES } from '../lib/constants'
import { discoveryMessages } from '../lib/i18n/messages/discovery'
import type { MessageCatalog } from '../lib/i18n/config'

const catalog: MessageCatalog = discoveryMessages
const aliases: Record<string, string[]> = {}
const normalize = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ')

function add(label: string, names: string[]) {
  for (const translation of catalog[label] ?? []) {
    const key = normalize(translation)
    aliases[key] = [...new Set([...(aliases[key] ?? []), ...names])]
  }
}

for (const modality of MODALITIES) add(modality.name, [modality.name])
for (const [category, label] of Object.entries(MODALITY_CATEGORIES)) {
  add(label, MODALITIES.filter((modality) => modality.category === category).map((modality) => modality.name))
}
for (const [label, categories] of Object.entries({
  'Psychedelic preparation': ['preparation'],
  'Psychedelic support': ['preparation', 'integration'],
  'Somatic practices': ['somatic'],
  'Recovery support': ['recovery'],
  'Meditation': ['meditation'],
})) {
  add(label, MODALITIES.filter((modality) => categories.includes(modality.category)).map((modality) => modality.name))
}
writeFileSync(new URL('../lib/i18n/search-aliases.json', import.meta.url), `${JSON.stringify(Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
