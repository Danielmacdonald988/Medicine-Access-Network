import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Core readiness only: this does not send a message or verify email delivery,
// the service-role key's validity, or the contact RPC's write permissions.
async function coreIsAvailable(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const contactKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !anonKey || !contactKey) return false

  let timeout: ReturnType<typeof setTimeout> | undefined
  const controller = new AbortController()
  try {
    // Use anonymous permissions and no visitor session. HEAD checks the public
    // directory without transferring a profile, count, or any private data.
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
    const deadline = new Promise<boolean>((resolve) => {
      timeout = setTimeout(() => {
        controller.abort()
        resolve(false)
      }, 4_000)
    })
    const query = supabase
      .from('facilitator_public_profiles')
      .select('id', { head: true })
      .limit(1)
      .abortSignal(controller.signal)
      .then(({ error }) => !error)
    return await Promise.race([query, deadline])
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET() {
  const available = await coreIsAvailable()
  return NextResponse.json(
    { status: available ? 'ok' : 'unavailable' },
    { status: available ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
