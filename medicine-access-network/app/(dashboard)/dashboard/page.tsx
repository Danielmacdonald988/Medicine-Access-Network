import { redirect } from 'next/navigation'
import { requireAuth, dashboardPathForRole } from '@/lib/auth'

/**
 * /dashboard is a dispatcher — it reads the user's role and immediately
 * redirects to the role-specific dashboard. This keeps each dashboard's
 * URL unambiguous and bookmarkable.
 */
export default async function DashboardPage() {
  const user = await requireAuth()
  redirect(dashboardPathForRole(user.role))
}
