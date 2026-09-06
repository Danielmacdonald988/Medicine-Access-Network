import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { boundedInteger, buildFacilitatorQuery, parseFacilitatorFilters } from '@/lib/facilitator-search'
import { parseSavedGuideQuery, SAVED_GUIDE_COLUMNS } from '@/lib/saved-guides'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.has('ids')) {
    const headers = { 'Cache-Control': 'private, no-store' }
    const ids = parseSavedGuideQuery(searchParams.getAll('ids'))
    if (!ids) return NextResponse.json({ error: 'Choose between 1 and 3 valid guide profiles.' }, { status: 400, headers })
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.from('facilitator_public_profiles')
        .select(SAVED_GUIDE_COLUMNS).in('id', ids).limit(3)
      if (error || !data) throw error ?? new Error('No directory response')
      return NextResponse.json({ data, total: data.length, limit: ids.length, offset: 0 }, { headers })
    } catch {
      return NextResponse.json({ error: 'Saved profiles could not be checked right now. Please try again.' }, { status: 503, headers: { ...headers, 'Retry-After': '30' } })
    }
  }
  const filters = parseFacilitatorFilters(searchParams)
  const limit = boundedInteger(searchParams.get('limit'), 20, 1, 100)
  const offset = boundedInteger(searchParams.get('offset'), 0, 0, 1000000)

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error, count } = await buildFacilitatorQuery(supabase, filters, {
      limit,
      offset,
      columns: 'id, display_name, bio, location, remote_available, modalities, donation_based, minimum_donation, hourly_rate, avatar_url, years_experience',
    })
    if (error?.code === 'PGRST103') {
      return NextResponse.json({ error: 'This results page is out of range. Start again with offset 0.' }, { status: 400 })
    }
    if (error) throw error
    return NextResponse.json({ data: data ?? [], total: count ?? 0, limit, offset })
  } catch {
    return NextResponse.json(
      { error: 'The guide directory is temporarily unavailable. Please try again.' },
      { status: 503, headers: { 'Retry-After': '30' } }
    )
  }
}
