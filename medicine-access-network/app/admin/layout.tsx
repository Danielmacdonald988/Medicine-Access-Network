import { requireRole } from '@/lib/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin')

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-stone-900">Admin dashboard</h1>
        <p className="text-sm text-stone-500">Facilitator verification and platform management</p>
      </div>
      {children}
    </div>
  )
}
