import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { boundedInteger, buildFacilitatorQuery, parseFacilitatorFilters } from '@/lib/facilitator-search'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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
