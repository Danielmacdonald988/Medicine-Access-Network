function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-4 space-y-2">
            <Bone className="h-3 w-20" />
            <Bone className="h-8 w-10" />
            <Bone className="h-3 w-28" />
          </div>
        ))}
      </div>

      <Bone className="h-px w-full" />

      {/* Applications */}
      <div className="space-y-4">
        <Bone className="h-6 w-48" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-stone-200 p-5 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-1">
                <Bone className="h-5 w-36" />
                <Bone className="h-4 w-24" />
              </div>
              <Bone className="h-4 w-20" />
            </div>
            <div className="flex gap-1.5">
              {[...Array(4)].map((_, j) => (
                <Bone key={j} className="h-6 w-20 rounded-full" />
              ))}
            </div>
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-4/5" />
            <Bone className="h-px w-full" />
            <Bone className="h-16 w-full rounded-lg" />
            <div className="flex gap-2">
              <Bone className="h-8 w-24 rounded-lg" />
              <Bone className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
