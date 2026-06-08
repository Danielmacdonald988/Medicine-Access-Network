import { ResourceNav } from '@/components/layout/ResourceNav'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <ResourceNav />
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  )
}
