function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function SeekerDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-8 w-52" />
          <Bone className="h-4 w-32" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-stone-200 p-5 space-y-3">
        <Bone className="h-5 w-24" />
        <Bone className="h-5 w-36" />
        <Bone className="h-4 w-24" />
        <div className="flex gap-1.5">
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="h-5 w-20 rounded-full" />
        </div>
      </div>

      <Bone className="h-px w-full" />

      {/* Active requests */}
      <div className="space-y-3">
        <Bone className="h-6 w-36" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-4 space-y-2">
            <div className="flex justify-between">
              <Bone className="h-5 w-40" />
              <Bone className="h-5 w-24 rounded-full" />
            </div>
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
