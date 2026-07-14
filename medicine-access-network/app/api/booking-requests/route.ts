import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { bookingRequestSchema } from '@/lib/validations'
import { z } from 'zod'

const createSchema = bookingRequestSchema.extend({
  facilitator_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'seeker') {
    return NextResponse.json({ error: 'Only seekers can send booking requests' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const {
    facilitator_id,
    requested_service,
    message,
    preferred_format,
    preferred_time_window,
  } = parsed.data

  // Verify the facilitator exists and is approved
  const { data: facilitator } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('user_id', facilitator_id)
    .eq('verification_status', 'approved')
    .single()

  if (!facilitator) {
    return NextResponse.json({ error: 'Facilitator not found or not available' }, { status: 404 })
  }

  const { error } = await supabase.from('booking_requests').insert({
    seeker_id: user.id,
    facilitator_id,
    requested_service,
    message,
    preferred_format,
    preferred_time_window: preferred_time_window ?? null,
    status: 'pending',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('booking_requests')
    .select('*')
    .or(`seeker_id.eq.${user.id},facilitator_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
