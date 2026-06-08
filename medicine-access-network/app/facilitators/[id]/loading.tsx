function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function FacilitatorProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-10 lg:col-span-2">
          {/* Header */}
          <div className="flex items-start gap-5">
            <Bone className="size-20 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              <Bone className="h-7 w-48" />
              <Bone className="h-4 w-32" />
              <div className="flex gap-2">
                <Bone className="h-4 w-20" />
                <Bone className="h-4 w-28" />
              </div>
            </div>
          </div>

          <Bone className="h-px w-full" />

          {/* Modalities */}
          <div className="space-y-3">
            <Bone className="h-5 w-36" />
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="h-7 w-24 rounded-full" />
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Bone className="h-5 w-16" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-5/6" />
          </div>

          {/* Safety */}
          <div className="rounded-xl border border-stone-200 p-5 space-y-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-xl border border-stone-200 p-5 space-y-4">
              <Bone className="h-5 w-36" />
              <Bone className="h-px w-full" />
              {[...Array(5)].map((_, i) => (
                <Bone key={i} className="h-9 w-full rounded-lg" />
              ))}
              <Bone className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
