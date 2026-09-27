import data from 'country-region-data/data.json'
import { z } from 'zod'

export type ProfileLocation = { city: string; region: string; country: string }
type Country = { countryName: string; countryShortCode: string; regions: { name: string; shortCode?: string }[] }
export const LOCATION_COUNTRIES: Country[] = data
const clean = (value: string) => value.trim().replace(/\s+/g, ' ')
export const regionValue = (region: Country['regions'][number]) => region.shortCode || region.name
export const countryFor = (code: string) => LOCATION_COUNTRIES.find(c => c.countryShortCode === code)
export const regionFor = (country: string, region: string) => countryFor(country)?.regions.find(r => regionValue(r) === region)

export const profileLocationSchema = z.object({
  city: z.string().transform(clean).pipe(z.string().min(1, 'Enter a city or town.').max(100).regex(/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .'’()\/-]*$/u, 'Enter a city or town, without a state or country.')),
  country: z.string().refine(code => Boolean(countryFor(code)), 'Choose a country from the list.'),
  region: z.string().max(120),
}).strict().superRefine((value, ctx) => {
  const country = countryFor(value.country)
  if (country && (country.regions.length ? !regionFor(value.country, value.region) : value.region !== '')) {
    ctx.addIssue({ code:'custom', path:['region'], message:'Choose a state, province, or region for this country.' })
  }
})
export const profileLocationsSchema = z.array(profileLocationSchema).min(1, 'Add at least one location.').max(5, 'Add up to five locations.').refine(
  values => new Set(values.map(v=>`${v.country}|${v.region}|${v.city.toLowerCase()}`)).size === values.length,
  'Remove duplicate locations.',
)
export function formatProfileLocations(values: readonly ProfileLocation[]): string {
  return values.map(value => [clean(value.city), regionFor(value.country, value.region)?.name, countryFor(value.country)?.countryName].filter(Boolean).join(', ')).join('; ')
}

const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’]/g,"'").trim().replace(/\s+/g,' ')
const aliases = new Map<string, Set<string>>()
function addAliases(names: string[]) {
  const normalized = names.map(normalize)
  for (const name of normalized) aliases.set(name, new Set([...(aliases.get(name) || []), ...normalized]))
}
const countryAliases: Record<string,string[]> = {
  US:['US','USA','United States of America'], GB:['UK','Great Britain'], CA:['Canada'], MX:['MX','México'], AU:['Australia'], NZ:['NZ'],
}
for (const country of LOCATION_COUNTRIES) {
  addAliases([country.countryName, ...(countryAliases[country.countryShortCode] || [])])
  for (const region of country.regions) {
    // Region codes have country-specific meanings; only expand the commonly
    // used postal abbreviations here. Full region names work for every country.
    addAliases([region.name, ...(['US','CA','MX','AU'].includes(country.countryShortCode) && region.shortCode ? [region.shortCode] : [])])
  }
}
function literal(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') }
function wordPattern(value: string) {
  const accents: Record<string,string> = {a:'[aàáâãäåā]',c:'[cçćč]',e:'[eèéêëē]',i:'[iìíîïī]',n:'[nñń]',o:'[oòóôõöøō]',s:'[sśš]',u:'[uùúûüū]',y:'[yýÿ]',z:'[zźž]'}
  return value.split(/\s+/).map(word=>[...word].map(char=>accents[char] || literal(char)).join('')).join('[[:space:]]+')
}
/** Matches city/region/country terms in any order within one location, before
 * database pagination. Codes are whole words, so NC never matches France. */
export function locationSearchPattern(input: string): string {
  const value = normalize(input).replace(/\bu\.s\.(?:a\.)?/g,'usa').replace(/\bu\.k\./g,'uk')
  const words = value.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || []
  if (!words.length) return literal(value)
  const parts: string[] = []
  for (let i=0; i<words.length;) {
    let length = Math.min(6,words.length-i)
    while (length>1 && !aliases.has(words.slice(i,i+length).join(' '))) length--
    const term = words.slice(i,i+length).join(' ')
    const names = [...(aliases.get(term) || [term])]
    parts.push(`(?=[^;]*\\m(${names.map(wordPattern).join('|')})\\M)`)
    i+=length
  }
  return `(^|;[[:space:]]*)${parts.join('')}[^;]*`
}
