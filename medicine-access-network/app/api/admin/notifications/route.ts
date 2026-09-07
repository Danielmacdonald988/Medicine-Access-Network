import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { hasCrossOriginSource, readSmallFormData, readSmallJson } from '@/lib/request-body'
import { dispatchAdminApplicationNotifications } from '@/lib/admin-notifications'

export const runtime = 'nodejs'
export const maxDuration = 60

const retrySchema = z.object({ action: z.literal('retry') }).strict()
const privateHeaders = { 'Cache-Control': 'private, no-store' }

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: privateHeaders })
}

function noticeRedirect(request: Request, notice: string) {
  return NextResponse.redirect(new URL(`/admin?notice=${notice}`, request.url), {
    status: 303,
    headers: privateHeaders,
  })
}

export async function POST(request: Request) {
  if (hasCrossOriginSource(request)) {
    return json({ error: 'This request must come from this site.' }, 403)
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return json({ error: 'Sign in to your admin account.' }, 401)
    const { data: account, error: accountError } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (accountError || account?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

    const isJson = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json'
    let input: unknown
    if (isJson) {
      const body = await readSmallJson(request)
      if (!body.ok) return json({ error: body.error }, body.status)
      input = body.data
    } else {
      const body = await readSmallFormData(request)
      if (!body.ok) return json({ error: body.error }, body.status)
      input = Object.fromEntries(body.data)
    }
    if (!retrySchema.safeParse(input).success) return json({ error: 'Invalid request.' }, 400)

    // The dispatcher claims a bounded batch and uses the server-configured
    // recipient. Neither a recipient nor email contents can come from this form.
    const result = await dispatchAdminApplicationNotifications()
    const notice = !result.configured
      ? 'notifications_unconfigured'
      : result.failed > 0 ? 'notifications_pending'
        : result.sent > 0 ? 'notifications_sent' : 'notifications_not_ready'
    return noticeRedirect(request, notice)
  } catch {
    console.error('[admin-notifications] retry could not finish')
    return noticeRedirect(request, 'notifications_pending')
  }
}
