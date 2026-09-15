'use client'

import { trafficSource, type EngagementEvent } from './engagement'

type Session = { id: string; expires: number; source: string; device: string }
let memory: Session | undefined
const sent = new Set<string>()
const pending = new Set<string>()
let queue = Promise.resolve()
let excluded = false

export function excludeEngagement(value: boolean) { excluded = value }

function getSession(): Session {
  if (memory && memory.expires > Date.now()) return memory
  try {
    const stored = JSON.parse(sessionStorage.getItem('tfn-engagement') || 'null') as Session | null
    if (stored && /^[a-f0-9-]{36}$/.test(stored.id) && stored.expires > Date.now()) return (memory = stored)
  } catch { /* Storage may be blocked; keep an in-memory session. */ }
  memory = {
    id: crypto.randomUUID(), expires: Date.now() + 86_400_000,
    source: trafficSource(document.referrer, location.hostname),
    device: /iPad|Tablet/i.test(navigator.userAgent) ? 'tablet' : /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  }
  try { sessionStorage.setItem('tfn-engagement', JSON.stringify(memory)) } catch { /* optional */ }
  return memory
}

export function recordEngagement(event: EngagementEvent, step = 0): void {
  if (typeof window === 'undefined' || excluded || location.pathname.startsWith('/admin') || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
  // Analytics is best-effort: no storage/network failure may break a form.
  try {
    const session = getSession()
    const key = `${session.id}:${event}:${step}`
    if (sent.has(key) || pending.has(key)) return
    pending.add(key)
    queue = queue.then(async () => {
      try {
        const response = await fetch('/api/engagement', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ session: session.id, event, step, source: session.source, device: session.device }),
        })
        if (response.ok) sent.add(key)
      } catch { /* optional */ } finally { pending.delete(key) }
    })
  } catch { /* Tracking is never required to use the site. */ }
}
