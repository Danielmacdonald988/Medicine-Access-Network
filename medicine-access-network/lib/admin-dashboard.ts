// Pure aggregation for the admin dashboard. No database access, so the
// period boundaries, funnel and daily series can be tested directly.
import { ADMIN_TIME_ZONE, startOfLocalDay, type ActivityEvent } from './today-activity'

export type Range = 'today' | '7d' | '30d'
export const RANGES: { value: Range; label: string; days: number }[] = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
]
export function parseRange(value: unknown): Range {
  return RANGES.some(r => r.value === value) ? value as Range : 'today'
}

export type Window = { from: Date; to: Date }
export type Bounds = { current: Window; previous: Window; chartDays: Date[] }

const HOUR = 3_600_000
/** Local midnight of the day before `dayStart`. */
function previousDay(dayStart: Date, tz: string) { return startOfLocalDay(new Date(dayStart.getTime() - HOUR), tz) }

/**
 * Today: midnight to now, compared with the same span yesterday (so a partial
 * day is never compared with a full one). 7d / 30d: the last N local days
 * including today, compared with the N days before.
 */
export function periodBounds(range: Range, now: Date, tz: string = ADMIN_TIME_ZONE): Bounds {
  const today = startOfLocalDay(now, tz)
  const days = RANGES.find(r => r.value === range)!.days
  let from = today
  for (let i = 1; i < days; i++) from = previousDay(from, tz)
  let prevFrom = from
  for (let i = 0; i < days; i++) prevFrom = previousDay(prevFrom, tz)
  const previous = range === 'today'
    ? { from: prevFrom, to: new Date(prevFrom.getTime() + (now.getTime() - today.getTime())) }
    : { from: prevFrom, to: from }
  const chartLength = range === '30d' ? 30 : 14
  const chartDays = [today]
  while (chartDays.length < chartLength) chartDays.unshift(previousDay(chartDays[0], tz))
  return { current: { from, to: now }, previous, chartDays }
}

const inWindow = (iso: string, w: Window) => { const t = Date.parse(iso); return t >= w.from.getTime() && t < w.to.getTime() }

export const FUNNEL_STEPS = [
  { key: 'visit', label: 'Visited the site' },
  { key: 'directory_view', label: 'Browsed the directory' },
  { key: 'profile_view', label: 'Opened a guide profile' },
  { key: 'contact_started', label: 'Started an inquiry' },
  { key: 'reached_out', label: 'Reached out to a guide' },
] as const

export type Summary = {
  sessions: Record<string, number>
  funnel: { key: string; label: string; value: number }[]
  sources: [string, number][]
  inquiries: number
  applications: number
  accounts: number
}

/** Distinct browser sessions per event in a window; "reached_out" = sent an inquiry or tapped a messaging link. */
export function summarize(events: ActivityEvent[], rows: { requests: { created_at: string }[]; applications: { created_at: string }[]; accounts: { created_at: string }[] }, w: Window): Summary {
  const byEvent = new Map<string, Set<string>>()
  const sources = new Map<string, Set<string>>()
  for (const e of events) {
    if (!inWindow(e.created_at, w)) continue
    const key = e.event === 'contact_sent' || e.event === 'direct_contact' ? 'reached_out' : e.event
    for (const k of key === e.event ? [key] : [key, e.event]) {
      if (!byEvent.has(k)) byEvent.set(k, new Set())
      byEvent.get(k)!.add(e.session_id)
    }
    if (e.event === 'visit') {
      if (!sources.has(e.source)) sources.set(e.source, new Set())
      sources.get(e.source)!.add(e.session_id)
    }
  }
  const sessions = Object.fromEntries([...byEvent].map(([k, v]) => [k, v.size]))
  return {
    sessions,
    funnel: FUNNEL_STEPS.map(s => ({ ...s, value: sessions[s.key] ?? 0 })),
    sources: [...sources].map(([k, v]) => [k, v.size] as [string, number]).sort((a, b) => b[1] - a[1]),
    inquiries: rows.requests.filter(r => inWindow(r.created_at, w)).length,
    applications: rows.applications.filter(r => inWindow(r.created_at, w)).length,
    accounts: rows.accounts.filter(r => inWindow(r.created_at, w)).length,
  }
}

/** Visitors (distinct visit sessions) and stored inquiries per local day. */
export function dailySeries(events: ActivityEvent[], requests: { created_at: string }[], days: Date[], now: Date) {
  return days.map((from, i) => {
    const w = { from, to: days[i + 1] ?? now }
    const visitors = new Set(events.filter(e => e.event === 'visit' && inWindow(e.created_at, w)).map(e => e.session_id)).size
    return { day: from, visitors, inquiries: requests.filter(r => inWindow(r.created_at, w)).length }
  })
}

/** Signed change, or null when there is nothing to compare against. */
export function change(current: number, previous: number): { delta: number; text: string } | null {
  if (current === 0 && previous === 0) return null
  const delta = current - previous
  return { delta, text: delta === 0 ? 'same' : `${delta > 0 ? '+' : '−'}${Math.abs(delta)}` }
}

export function rate(part: number, whole: number): string {
  return whole ? `${Math.round(100 * part / whole)}%` : '–'
}
