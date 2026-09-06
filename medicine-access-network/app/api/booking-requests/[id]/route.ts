import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { hasCrossOriginSource, readSmallFormData, readSmallJson } from '@/lib/request-body'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed']),
})
const requestIdSchema = z.string().uuid()

interface RouteParams {
  params: Promise<{ id: string }>
}

async function updateStatus(request: Request, { params }: RouteParams, isForm: boolean) {
  if (hasCrossOriginSource(request)) {
    return NextResponse.json({ error: 'This request must come from this site.' }, { status: 403 })
  }
  const { id } = await params
  if (!requestIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid conversation request.' }, { status: 400 })
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return isForm
        ? NextResponse.redirect(new URL('/login', request.url), 303)
        : NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body: unknown
    if (isForm) {
      const result = await readSmallFormData(request)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
      body = { status: result.data.get('status') }
    } else {
      const result = await readSmallJson(request)
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
      body = result.data
    }
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    // RLS and the recipient filter both restrict this write. Returning its id
    // distinguishes an actual update from a missing or inaccessible request.
    const { data, error } = await supabase
      .from('booking_requests')
      .update({ status: parsed.data.status })
      .eq('id', id)
      .eq('facilitator_id', user.id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[booking-requests] Status update failed', { code: error.code })
      return NextResponse.json({ error: 'We could not update this request. Please try again.' }, { status: 503 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Conversation request not found.' }, { status: 404 })
    }

    return isForm
      ? NextResponse.redirect(new URL('/facilitator', request.url), 303)
      : NextResponse.json({ success: true })
  } catch {
    console.error('[booking-requests] Status service unavailable')
    return NextResponse.json({ error: 'We could not update this request. Please try again.' }, { status: 503 })
  }
}

// JSON clients and the dashboard's plain HTML form use the same checked write.
export async function PATCH(request: Request, context: RouteParams) {
  return updateStatus(request, context, false)
}

export async function POST(request: Request, context: RouteParams) {
  return updateStatus(request, context, true)
}
