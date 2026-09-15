import { NextResponse } from 'next/server'
import { createCallbackSupabaseClient } from '@/lib/supabase-callback'
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth'
import { safeRedirectPath } from '@/lib/safe-redirect'

/**
 * Handles the OAuth / email-confirmation code exchange.
 *
 * Supabase redirects here after:
 *   - Email confirmation (sign-up)
 *   - Magic link login
 *   - Password reset (next=/update-password)
 *
 * Only facilitators and admins authenticate at all — seekers have no
 * accounts (see the seeker-account-removal migration) — so the only
 * "new user, no profile yet" case left is a facilitator who has just
 * confirmed their email but hasn't submitted the onboarding form. That
 * case routes to /onboarding/facilitator below, not to the dashboard.
 *
 * Configure in Supabase: Authentication → URL Configuration
 *   Site URL:            https://yourdomain.com
 *   Redirect URLs:       https://yourdomain.com/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const isEmailToken = !!tokenHash && searchParams.get('type') === 'email'
  const next = safeRedirectPath(searchParams.get('next'))

  if (!code && !isEmailToken) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  const { supabase, redirect } = createCallbackSupabaseClient(request)
  // Token hashes work across browsers, including Instagram → an email app.
  // Only email tokens are accepted here; recovery keeps its existing code flow.
  const { error: exchangeError } = isEmailToken
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: 'email' })
    : await supabase.auth.exchangeCodeForSession(code!)

  if (exchangeError) {
    console.error('[auth callback] code exchange failed', { status: exchangeError.status })
    return redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Password reset etc. — an explicit `next` wins outright.
  if (next !== '/dashboard') {
    return redirect(next)
  }

  // getCurrentUser() self-heals the public.users row if the signup trigger
  // hasn't run yet, and logs (rather than swallows) any real query error.
  // A null return at this point means a real failure occurred — "no row
  // yet" is not possible here, since getCurrentUser() self-heals that case
  // internally. Do not reinterpret null as "new user, needs onboarding."
  const user = await getCurrentUser(supabase)

  if (!user) {
    console.error('[auth callback] authenticated but no user profile could be loaded or created')
    return redirect(`${origin}/auth/error?reason=profile_lookup_failed`)
  }

  if (user.role === 'facilitator') {
    const { data: facilitatorProfile, error: facilitatorLookupError } = await supabase
      .from('facilitator_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (facilitatorLookupError) {
      // A real query error (RLS, connection, etc.) — not the same as "row
      // doesn't exist," which maybeSingle() reports as `data: null` with no
      // error. Must not be treated as "just needs onboarding."
      console.error(
        '[auth callback] facilitator profile lookup failed',
        { code: facilitatorLookupError.code }
      )
      return redirect(`${origin}/auth/error?reason=facilitator_profile_lookup_failed`)
    }

    return redirect(
      `${origin}${facilitatorProfile ? '/facilitator' : '/onboarding/facilitator'}`
    )
  }

  // Admins (and any pre-existing legacy 'seeker' rows, pending cleanup)
  // fall back to the standard role-based dashboard redirect.
  return redirect(`${origin}${dashboardPathForRole(user.role)}`)
}
