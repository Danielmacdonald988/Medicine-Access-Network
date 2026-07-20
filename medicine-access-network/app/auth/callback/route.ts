import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth'

/**
 * Handles the OAuth / email-confirmation code exchange.
 *
 * Supabase redirects here after:
 *   - Email confirmation (sign-up)
 *   - Magic link login
 *   - Password reset (next=/update-password)
 *
 * Configure in Supabase: Authentication → URL Configuration
 *   Site URL:            https://yourdomain.com
 *   Redirect URLs:       https://yourdomain.com/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // After a successful code exchange, redirect to the right dashboard
      // unless `next` is explicitly set (e.g. /update-password after reset).
      if (next !== '/dashboard') {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Look up role and route accordingly. getCurrentUser() self-heals the
      // public.users row if the signup trigger hasn't created it yet.
      const user = await getCurrentUser()

      if (user) {
        return NextResponse.redirect(`${origin}${dashboardPathForRole(user.role)}`)
      }

      return NextResponse.redirect(`${origin}/auth/error?reason=profile_missing`)
    }
  }

  // Code missing or exchange failed — send to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
