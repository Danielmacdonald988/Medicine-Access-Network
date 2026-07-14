import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { dashboardPathForRole } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

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

      // Look up role and route accordingly
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const path = dashboardPathForRole(profile.role as UserRole)
          return NextResponse.redirect(`${origin}${path}`)
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Code missing or exchange failed — send to login with an error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
