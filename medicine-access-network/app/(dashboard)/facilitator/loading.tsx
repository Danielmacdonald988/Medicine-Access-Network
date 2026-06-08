function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function FacilitatorDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bone className="size-10 rounded-full" />
        <div className="space-y-2">
          <Bone className="h-7 w-44" />
          <Bone className="h-4 w-28" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-4 space-y-2">
            <Bone className="h-3 w-16" />
            <Bone className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Status card */}
      <Bone className="h-16 w-full rounded-xl" />

      <Bone className="h-px w-full" />

      {/* Requests */}
      <div className="space-y-3">
        <Bone className="h-6 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-4 space-y-2">
            <div className="flex justify-between">
              <Bone className="h-5 w-40" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
