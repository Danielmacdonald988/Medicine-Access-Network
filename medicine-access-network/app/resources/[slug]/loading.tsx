function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

export default function ResourceLoading() {
  return (
    <div className="space-y-5">
      <Bone className="h-4 w-20" />
      <div className="border-b border-stone-100 pb-6 space-y-2">
        <Bone className="h-9 w-72" />
        <Bone className="h-5 w-56" />
      </div>
      <div className="space-y-4">
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-14 w-full rounded-xl" />
        <Bone className="h-6 w-48" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <div className="space-y-2 pl-4">
          {[...Array(4)].map((_, i) => (
            <Bone key={i} className="h-4 w-4/5" />
          ))}
        </div>
        <Bone className="h-6 w-44" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-2/3" />
      </div>
    </div>
  )
}
