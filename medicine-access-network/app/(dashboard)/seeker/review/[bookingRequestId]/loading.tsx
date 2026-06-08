function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function ReviewLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Bone className="h-4 w-32" />
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-56" />
      </div>
      <div className="rounded-xl border border-stone-200 p-6 space-y-6">
        <Bone className="h-5 w-32" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Bone className="h-4 w-28" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="size-7 rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-36" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="size-7 rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-44" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="size-7 rounded" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-24" />
            <Bone className="h-28 w-full" />
          </div>
          <Bone className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
