import { NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { getCurrentUser } from '@/lib/auth'
import { hasCrossOriginSource, readSmallJson } from '@/lib/request-body'
import { DEVICES, ENGAGEMENT_EVENTS, SOURCES } from '@/lib/engagement'

export const runtime = 'nodejs'
const schema = z.object({
  session: z.uuid(), event: z.enum(ENGAGEMENT_EVENTS),
  step: z.number().int().min(0).max(14), source: z.enum(SOURCES), device: z.enum(DEVICES),
}).strict().refine(data => data.event === 'application_step' ? data.step >= 1 : data.step === 0)

export async function POST(request: Request) {
  if (hasCrossOriginSource(request)) return new NextResponse(null, { status: 403 })
  if (process.env.VERCEL_ENV === 'preview' || request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return new NextResponse(null, { status: 204 })
  const body = await readSmallJson(request)
  if (!body.ok) return new NextResponse(null, { status: body.status })
  const parsed = schema.safeParse(body.data)
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() : process.env.NODE_ENV !== 'production' ? '127.0.0.1' : null
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !isIP(ip) || !secret) return new NextResponse(null, { status: 503 })
  try {
    const user = await getCurrentUser()
    if (user?.role === 'admin') return new NextResponse(null, { status: 204 })
    const { session, event, step, source, device } = parsed.data
    const { error } = await createAdminSupabaseClient().rpc('record_engagement', {
      p_session: session, p_event: event, p_step: step, p_source: source, p_device: device,
      p_rate_key: createHmac('sha256', secret).update(`engagement:${new Date().toISOString().slice(0, 10)}:${ip}`).digest('hex'),
    })
    if (error) return new NextResponse(null, { status: error.message === 'engagement_rate_limited' ? 429 : 503 })
    return new NextResponse(null, { status: 204 })
  } catch { return new NextResponse(null, { status: 503 }) }
}
