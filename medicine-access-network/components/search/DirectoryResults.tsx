'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** The directory streams in after navigation; its hash target may not exist yet. */
export function DirectoryResults({ label, children }: { label: string; children: ReactNode }) {
  const target = useRef<HTMLElement>(null)
  useEffect(() => {
    if (window.location.hash !== '#guide-results') return
    target.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    target.current?.focus({ preventScroll: true })
  }, [])

  return <section ref={target} id="guide-results" tabIndex={-1} aria-label={label} className="min-w-0 flex-1 scroll-mt-24">
    {children}
  </section>
}
