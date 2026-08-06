import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { UserRole } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  full_name: string
  role: UserRole
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the authenticated user + their app-level profile row, or null.
 * Safe to call from any Server Component or Route Handler — never throws,
 * so a transient DB hiccup degrades callers (e.g. the navbar) to a
 * logged-out view instead of crashing the page.
 *
 * If the `public.users` row is missing (e.g. the on_auth_user_created trigger
 * hasn't run yet or failed), this recreates it from the auth metadata that was
 * captured at signup, instead of silently treating the user as logged out.
 *
 * IMPORTANT: "no row yet" and "the query failed" are different things and
 * are handled differently. `.single()` reports "no row" as a Postgrest
 * error with code PGRST116 — that's the expected, benign case this
 * function self-heals. Any OTHER error code (RLS denial, connection
 * failure, etc.) is a real bug and must not be silently treated as "this
 * user just needs their row created" — it's logged here so it's visible in
 * server logs, and callers that need to tell the two cases apart (see
 * app/auth/callback/route.ts) should not rely on this function alone.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('[getCurrentUser] users lookup failed for', user.id, profileError)
    return null
  }

  if (!profile) {
    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? '',
        // Only facilitators and admins sign up through this path now —
        // seekers have no accounts. 'facilitator' is the correct default
        // for a brand-new row whose metadata is somehow missing a role,
        // not the old 'seeker' fallback.
        role: (user.user_metadata?.role as UserRole) ?? 'facilitator',
      },
      { onConflict: 'id' }
    )

    if (upsertError) {
      console.error('[getCurrentUser] self-heal upsert failed for', user.id, upsertError)
      return null
    }

    ;({ data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single())

    if (profileError) {
      console.error('[getCurrentUser] users re-fetch after self-heal failed for', user.id, profileError)
      return null
    }
  }

  if (!profile) return null

  return {
    id: user.id,
    email: user.email ?? '',
    full_name: profile.full_name,
    role: profile.role as UserRole,
  }
}

/**
 * Requires an authenticated session.
 * Redirects to /login if there's no session at all. If the session is valid
 * but a profile row still can't be found/created, that's a real failure —
 * getCurrentUser() self-heals the benign "row doesn't exist yet" case
 * internally and only returns null after logging a genuine error (RLS
 * misconfig, connection issue, etc.) — so this redirects to /auth/error
 * rather than /login, since sending a signed-in user back to /login just
 * bounces them straight back here via the middleware, producing an
 * infinite redirect loop.
 */
export async function requireAuth(): Promise<SessionUser> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const user = await getCurrentUser()
  if (!user) redirect('/auth/error?reason=profile_lookup_failed')
  return user
}

/**
 * Requires authentication AND a specific role.
 * Redirects unauthenticated users to /login,
 * wrong-role users to /dashboard.
 */
export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireAuth()
  if (user.role !== role) redirect('/dashboard')
  return user
}

/**
 * Returns the role-based redirect path after sign-in.
 * Used by login + signup flows.
 *
 * There is no more 'seeker' destination — seekers have no accounts and
 * /seeker no longer exists as a route. The default case only exists for
 * a pre-existing row with a legacy 'seeker' role value (the enum still
 * allows it; nothing purges old data automatically — see the
 * seeker-account-removal migration notes) logging in with old credentials.
 * Sending them to browse rather than a dead route is the least surprising
 * option available now that there's no seeker dashboard to send them to.
 */
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'facilitator':
      return '/facilitator'
    default:
      return '/facilitators'
  }
}

/**
 * Lightweight session check — does not query the users table.
 * Suitable for middleware-adjacent use where speed matters.
 */
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
