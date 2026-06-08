import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed']),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH /api/booking-requests/[id] — facilitator updates status
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  // RLS ensures only the facilitator of this request can update it
  const { error } = await supabase
    .from('booking_requests')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('facilitator_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// POST /api/booking-requests/[id] — plain HTML form fallback (no JS)
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form' }, { status: 400 })

  const status = formData.get('status')
  const parsed = updateSchema.safeParse({ status })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  await supabase
    .from('booking_requests')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .eq('facilitator_id', user.id)

  return NextResponse.redirect(new URL('/facilitator', request.url))
}
