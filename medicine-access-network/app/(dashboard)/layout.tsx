import { requireAuth } from '@/lib/auth'

// Middleware already guards this group, but requireAuth() here is the
// defence-in-depth fallback for direct Server Component access.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
  )
}
