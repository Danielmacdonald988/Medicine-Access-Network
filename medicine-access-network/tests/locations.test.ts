import assert from 'node:assert/strict'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { formatProfileLocations, locationSearchPattern, profileLocationsSchema } from '../lib/locations'

test('new profiles use catalog countries and regions and generate canonical public text', () => {
  const locations = profileLocationsSchema.parse([
    {city:'  Cary  ',region:'NC',country:'US'},
    {city:'Playa  del Carmen',region:'ROO',country:'MX'},
  ])
  assert.equal(formatProfileLocations(locations),'Cary, North Carolina, United States; Playa del Carmen, Quintana Roo, Mexico')
  for (const bad of [[], [{city:'Cary',region:'North Carolina',country:'US'}], [{city:'Cary',region:'NC',country:'MX'}], [{city:'',region:'NC',country:'US'}], [{city:'Cary, NC',region:'NC',country:'US'}], [{city:'Cary',region:'NC',country:'USA'}]]) {
    assert.equal(profileLocationsSchema.safeParse(bad).success,false)
  }
  assert.equal(profileLocationsSchema.safeParse([locations[0],{...locations[0],city:'cary'}]).success,false)
})

test('PostgreSQL location filtering matches names, abbreviations and accents without crossing locations', async () => {
  const db = new PGlite()
  try {
    const cases: [string,string,boolean][] = [
      ['Cary, NC, USA','North Carolina',true],
      ['Cary, North Carolina, United States','NC',true],
      ['Cary, North Carolina, United States','Cary NC',true],
      ['Cary, North Carolina, United States','North Carolina, Cary',true],
      ['Cary, North Carolina, United States','Cary USA',true],
      ['Cary, North Carolina, United States','U.S.A.',true],
      ['Delray Beach, Florida, United States','FL',true],
      ['Boston, Massachusetts, United States','MA',true],
      ['Playa del Carmen, Quintana Roo, Mexico','México',true],
      ['Montréal, Quebec, Canada','Montreal',true],
      ['Paris, Île-de-France, France','NC',false],
      ['Boston, Massachusetts, United States; Playa del Carmen, Quintana Roo, Mexico','Boston Mexico',false],
      ['Boston, Massachusetts, United States; Playa del Carmen, Quintana Roo, Mexico','Playa Mexico',true],
      ['Cary, North Carolina, United States','.*',false],
      ['Cary, North Carolina, United States','Florida',false],
    ]
    for (const [location,query,expected] of cases) {
      const result = await db.query<{matches:boolean}>('select $1::text ~* $2::text as matches',[location,locationSearchPattern(query)])
      assert.equal(result.rows[0].matches, expected, `${query} → ${location}`)
    }
  } finally { await db.close() }
})
