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
 * Safe to call from any Server Component or Route Handler.
 *
 * If the `public.users` row is missing (e.g. the on_auth_user_created trigger
 * hasn't run yet or failed), this recreates it from the auth metadata that was
 * captured at signup, instead of silently treating the user as logged out.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  let { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name ?? '',
        role: (user.user_metadata?.role as UserRole) ?? 'seeker',
      },
      { onConflict: 'id' }
    )
    ;({ data: profile } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single())
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
 * but a profile row still can't be found/created (e.g. blocked by RLS),
 * redirects to /auth/error instead of /login — sending a signed-in user back
 * to /login just bounces them straight back here via the middleware,
 * producing an infinite redirect loop.
 */
export async function requireAuth(): Promise<SessionUser> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const user = await getCurrentUser()
  if (!user) redirect('/auth/error?reason=profile_missing')
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
 */
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'facilitator':
      return '/facilitator'
    default:
      return '/seeker'
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
