import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { verificationNoteSchema, type VerificationNoteInput } from '@/lib/validations'
import { hasCrossOriginSource, readSmallFormData, readSmallJson } from '@/lib/request-body'

type AdminSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>

async function requireAdmin(supabase: AdminSupabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

async function saveReview(supabase: AdminSupabase, adminId: string, profileId: string, input: VerificationNoteInput) {
  const { data: profile, error: lookupError } = await supabase
    .from('facilitator_profiles')
    .select('user_id')
    .eq('id', profileId)
    .maybeSingle()

  if (lookupError) return { success: false as const, status: 500, error: 'Unable to load this application.' }
  if (!profile) return { success: false as const, status: 404, error: 'Facilitator not found.' }

  const { data: updated, error: updateError } = await supabase
    .from('facilitator_profiles')
    .update({
      verification_status: input.status,
      visibility: input.status === 'approved' ? 'public' : 'hidden',
    })
    .eq('id', profileId)
    .select('id')
    .maybeSingle()

  if (updateError || !updated) return { success: false as const, status: 500, error: 'The review decision could not be saved. Please try again.' }

  // Record a note only after the publication decision has succeeded.
  if (input.note) {
    const { error } = await supabase.from('verification_notes').insert({
      facilitator_id: profile.user_id,
      admin_id: adminId,
      status: input.status,
      note: input.note,
    })
    if (error) return { success: true as const, noteSaved: false }
  }
  return { success: true as const, noteSaved: true }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (hasCrossOriginSource(request)) {
    return NextResponse.json({ error: 'This request must come from this site.' }, { status: 403 })
  }
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await readSmallJson(request)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const parsed = verificationNoteSchema.safeParse(body.data)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })

  const result = await saveReview(supabase, admin.id, id, parsed.data)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, noteSaved: result.noteSaved })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (hasCrossOriginSource(request)) {
    return NextResponse.json({ error: 'This request must come from this site.' }, { status: 403 })
  }
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await readSmallFormData(request)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const formData = body.data
  const note = formData.get('note')
  const parsed = verificationNoteSchema.safeParse({
    status: formData.get('status'),
    note: typeof note === 'string' ? note.trim() || undefined : undefined,
  })
  if (!parsed.success) return NextResponse.redirect(new URL('/admin?notice=invalid', request.url), 303)

  const result = await saveReview(supabase, admin.id, id, parsed.data)
  const notice = !result.success ? 'update_failed' : !result.noteSaved ? 'note_failed' : parsed.data.status === 'approved' ? 'published' : 'hidden'
  return NextResponse.redirect(new URL(`/admin?notice=${notice}`, request.url), 303)
}
