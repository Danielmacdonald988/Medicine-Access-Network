import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase'
import { reviewSchema } from '@/lib/validations'

const createReviewSchema = reviewSchema.extend({
  booking_request_id: z.string().uuid(),
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
    return NextResponse.json({ error: 'Only seekers can leave reviews' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { booking_request_id, rating, text, safety_rating, integration_rating } = parsed.data

  // Verify the booking request exists, is completed, and belongs to this seeker.
  const { data: bookingRequest } = await supabase
    .from('booking_requests')
    .select('id, seeker_id, facilitator_id, status')
    .eq('id', booking_request_id)
    .eq('seeker_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!bookingRequest) {
    return NextResponse.json(
      { error: 'Booking request not found or not eligible for review' },
      { status: 404 }
    )
  }

  // Check for an existing review on this exact booking request.
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_request_id', booking_request_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You have already reviewed this conversation' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('reviews').insert({
    booking_request_id,
    seeker_id: user.id,
    facilitator_id: bookingRequest.facilitator_id,
    rating,
    text,
    safety_rating,
    integration_rating,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
