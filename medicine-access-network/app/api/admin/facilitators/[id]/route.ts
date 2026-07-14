import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { verificationNoteSchema } from '@/lib/validations'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'admin') return null
  return user
}

// JSON API — used if you want to call this from a client
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = verificationNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { status, note } = parsed.data

  const { data: fp } = await supabase
    .from('facilitator_profiles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!fp) {
    return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 })
  }

  const [updateResult] = await Promise.all([
    supabase
      .from('facilitator_profiles')
      .update({ verification_status: status })
      .eq('id', id),
    note
      ? supabase.from('verification_notes').insert({
          facilitator_id: fp.user_id,
          admin_id: admin.id,
          status,
          note,
        })
      : Promise.resolve(),
  ])

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Form fallback — plain HTML form POST, redirects back to /admin
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const admin = await requireAdmin(supabase)
  if (!admin) {
    return NextResponse.redirect(new URL('/admin', request.url), 302)
  }

  const formData = await request.formData()
  const status = formData.get('status') as string
  const note = (formData.get('note') as string | null)?.trim() || undefined

  const parsed = verificationNoteSchema.safeParse({ status, note })
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/admin', request.url), 302)
  }

  const { data: fp } = await supabase
    .from('facilitator_profiles')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fp) {
    await Promise.all([
      supabase
        .from('facilitator_profiles')
        .update({ verification_status: parsed.data.status })
        .eq('id', id),
      parsed.data.note
        ? supabase.from('verification_notes').insert({
            facilitator_id: fp.user_id,
            admin_id: admin.id,
            status: parsed.data.status,
            note: parsed.data.note,
          })
        : Promise.resolve(),
    ])
  }

  return NextResponse.redirect(new URL('/admin', request.url), 302)
}
