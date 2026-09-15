'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { pageEvent } from '@/lib/engagement'
import { excludeEngagement, recordEngagement } from '@/lib/engagement-client'

export function EngagementTracker({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname()
  useEffect(() => {
    excludeEngagement(isAdmin)
    if (isAdmin || /^\/(admin|auth|api|login|forgot-password|update-password|facilitator|dashboard)(\/|$)/.test(path)) return
    recordEngagement('visit')
    const event = pageEvent(path)
    if (event) recordEngagement(event)
  }, [path, isAdmin])
  return null
}

export function SearchEngagement({ empty, active }: { empty: boolean; active: boolean }) {
  useEffect(() => {
    if (!active) return
    recordEngagement('search_used')
    if (empty) recordEngagement('search_empty')
  }, [empty, active])
  return null
}
