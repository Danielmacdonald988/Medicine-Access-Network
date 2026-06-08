function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <Bone className="size-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-40" />
          <Bone className="h-3 w-24" />
          <div className="flex gap-1.5 pt-1">
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
            <Bone className="h-5 w-14 rounded-full" />
          </div>
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  )
}

export default function FacilitatorsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar skeleton */}
        <div className="space-y-4 lg:col-span-1">
          <Bone className="h-8 w-32" />
          {[...Array(5)].map((_, i) => (
            <Bone key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>

        {/* Results skeleton */}
        <div className="lg:col-span-3">
          <Bone className="mb-6 h-5 w-28" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
