import { NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { sendFacilitatorInquiryEmail } from '@/lib/email'
import { contactRequestSchema } from '@/lib/validations'

export const runtime = 'nodejs'

function getClientIp(request: Request): string | null {
  // Vercel overwrites this header at its edge. Do not trust arbitrary forwarded
  // headers on another production host without configuring its trusted proxy.
  if (process.env.VERCEL === '1') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    return ip && isIP(ip) ? ip : null
  }
  return process.env.NODE_ENV !== 'production' ? '127.0.0.1' : null
}

async function readSmallJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 16_384) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

export async function POST(request: Request) {
  const body = await readSmallJson(request)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const website = (body as Record<string, unknown>).website
  if (typeof website === 'string' && website.trim()) {
    return NextResponse.json({ success: true }, { status: 201 })
  }
  const parsed = contactRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please check the request fields.' }, { status: 400 })
  }

  const ip = getClientIp(request)
  const rateSecret = process.env.CONTACT_RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!ip || !rateSecret) {
    return NextResponse.json({ error: 'Messaging is temporarily unavailable. Please try again later.' }, { status: 503 })
  }

  try {
    // No visitor cookies: the public HTTP route uses only this narrowly scoped
    // server RPC. Anonymous database callers cannot submit or read contact info.
    const supabase = createAdminSupabaseClient()
    const input = parsed.data
    const { data, error } = await supabase.rpc('submit_contact_request', {
      p_facilitator_profile_id: input.facilitator_profile_id,
      p_rate_limit_key: createHmac('sha256', rateSecret).update(ip).digest('hex'),
      p_seeker_name: input.seeker_name,
      p_seeker_email: input.seeker_email,
      p_requested_service: input.requested_service,
      p_message: input.message,
      p_preferred_format: input.preferred_format,
      p_preferred_time_window: input.preferred_time_window || null,
    })

    if (error) {
      if (error.message === 'contact_rate_limited') {
        return NextResponse.json(
          { error: 'Too many requests from this connection. Please try again in an hour.' },
          { status: 429, headers: { 'Retry-After': '3600' } }
        )
      }
      if (error.code === '22023') {
        return NextResponse.json({ error: 'Please check the request fields.' }, { status: 400 })
      }
      // Database error details can contain submitted values; log the code only.
      console.error('[contact-requests] submission failed', { code: error.code })
      return NextResponse.json({ error: 'We could not save your message. Please try again.' }, { status: 503 })
    }

    const contact = data?.[0]
    if (!contact) {
      return NextResponse.json({ error: 'Guide not found or not available' }, { status: 404 })
    }

    // Storage has committed. Notification failure must not invite a duplicate.
    await sendFacilitatorInquiryEmail({
      facilitatorEmail: contact.facilitator_email,
      facilitatorDisplayName: contact.facilitator_display_name,
      seekerName: input.seeker_name,
      seekerEmail: input.seeker_email,
      requestedService: input.requested_service,
      message: input.message,
      preferredFormat: input.preferred_format,
      preferredTimeWindow: input.preferred_time_window,
    })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    console.error('[contact-requests] service unavailable')
    return NextResponse.json({ error: 'We could not confirm delivery. Please try again later.' }, { status: 503 })
  }
}
