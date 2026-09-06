import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { hasCrossOriginSource } from '@/lib/request-body'

export async function POST(request: Request) {
  if (hasCrossOriginSource(request)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 })
  }
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    return NextResponse.json({ error: 'Could not sign out. Please try again.' }, { status: 503 })
  }
  return NextResponse.redirect(new URL('/', request.url), 303)
}
