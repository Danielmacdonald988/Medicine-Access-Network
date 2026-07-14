import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const q = searchParams.get('q')
  const modalities = searchParams.getAll('modality')
  const remote = searchParams.get('remote') === 'true'
  const donation = searchParams.get('donation') === 'true'
  const location = searchParams.get('location')
  const minExp = parseInt(searchParams.get('min_exp') ?? '', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('facilitator_profiles')
    .select(
      'id, display_name, bio, location, remote_available, modalities, donation_based, minimum_donation, hourly_rate, avatar_url, years_experience, verification_status',
      { count: 'exact' }
    )
    .eq('verification_status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (remote) query = query.eq('remote_available', true)
  if (donation) query = query.eq('donation_based', true)
  if (modalities.length > 0) query = query.overlaps('modalities', modalities)
  if (location) query = query.ilike('location', `%${location}%`)
  if (!isNaN(minExp) && minExp > 0) query = query.gte('years_experience', minExp)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // In-memory text search for MVP
  const filtered = q
    ? data?.filter(
        (f) =>
          f.display_name.toLowerCase().includes(q.toLowerCase()) ||
          f.bio.toLowerCase().includes(q.toLowerCase()) ||
          (f.location ?? '').toLowerCase().includes(q.toLowerCase()) ||
          (f.modalities ?? []).some((m: string) =>
            m.toLowerCase().includes(q.toLowerCase())
          )
      )
    : data

  return NextResponse.json({ data: filtered, total: count, limit, offset })
}
