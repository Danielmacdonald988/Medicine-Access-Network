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
  void adminId // Database records auth.uid(), never a client-supplied admin ID.
  const { error } = await supabase.rpc('review_facilitator_application', {
    p_profile_id: profileId,
    p_status: input.status,
    p_note: input.note || null,
    p_checklist_version: input.status === 'approved' && input.review_checklist ? '2026-09-27.1' : null,
  })
  if (error) return { success: false as const, status: error.code === 'P0002' ? 404 : error.code === '23514' ? 400 : 500, error: 'The decision could not be saved. Check the application and approval checklist, then retry.' }
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
    review_checklist: formData.get('review_checklist') === 'on',
    note: typeof note === 'string' ? note.trim() || undefined : undefined,
  })
  if (!parsed.success) return NextResponse.redirect(new URL('/admin?notice=invalid', request.url), 303)

  const result = await saveReview(supabase, admin.id, id, parsed.data)
  const notice = !result.success ? 'update_failed' : !result.noteSaved ? 'note_failed' : parsed.data.status === 'approved' ? 'published' : 'hidden'
  return NextResponse.redirect(new URL(`/admin?notice=${notice}`, request.url), 303)
}
