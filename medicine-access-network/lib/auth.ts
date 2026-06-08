import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
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
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

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
 * Redirects to /login if the user is not signed in.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
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
