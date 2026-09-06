import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// The POST handler that used to live here (authenticated-seeker booking
// requests) has been removed — seekers no longer have accounts, so it could
// never be satisfied by any caller anymore. New contact submissions go
// through POST /api/contact-requests instead (stateless, no session
// required). This file keeps the GET handler: a facilitator or admin
// listing their own booking_requests rows, which the underlying table
// still serves — it now holds both legacy authenticated-seeker rows and
// new anonymous contact submissions side by side. See db/migrations/0003.

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401, headers })
    }

    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .or(`seeker_id.eq.${user.id},facilitator_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[booking-requests] Inbox lookup failed', { code: error.code })
      return NextResponse.json({ error: 'We could not load your requests. Please try again.' }, { status: 503, headers })
    }

    return NextResponse.json(data, { headers })
  } catch {
    console.error('[booking-requests] Inbox service unavailable')
    return NextResponse.json({ error: 'We could not load your requests. Please try again.' }, { status: 503, headers })
  }
}
