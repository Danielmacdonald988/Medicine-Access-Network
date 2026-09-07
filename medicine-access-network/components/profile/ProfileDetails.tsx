'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

/** Keep the full content available, including when arriving at a section link. */
export function ProfileDetails({ id, title, children }: {
  id: string
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const revealTarget = () => {
      const details = ref.current
      if (!details || window.location.hash !== `#${id}`) return
      details.open = true
      details.scrollIntoView({ block: 'start' })
    }
    const revealLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a')?.getAttribute('href') === `#${id}` && ref.current) {
        ref.current.open = true
      }
    }
    revealTarget()
    window.addEventListener('hashchange', revealTarget)
    document.addEventListener('click', revealLink)
    return () => {
      window.removeEventListener('hashchange', revealTarget)
      document.removeEventListener('click', revealLink)
    }
  }, [id])

  return (
    <details ref={ref} id={id} className="group scroll-mt-24 rounded-xl border border-stone-200 bg-white">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 focus-visible:outline-2 focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-medium tracking-tight text-stone-900">{title}</h2>
        <ChevronDown aria-hidden className="size-5 shrink-0 text-stone-500 group-open:rotate-180" />
      </summary>
      <div className="border-t border-stone-100 px-5 py-5">{children}</div>
    </details>
  )
}
