// Pure helpers for the admin "Today" panel. No database access here so the
// day boundaries and counting rules can be tested without a database.

// The operator's working time zone. "Today" starts at local midnight here.
export const ADMIN_TIME_ZONE = 'America/Cancun'

/** UTC instant of local midnight, in `timeZone`, for the day containing `now`. */
export function startOfLocalDay(now: Date, timeZone: string = ADMIN_TIME_ZONE): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
  // Offset between the zone's wall clock and UTC at this instant.
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  const offsetMs = wallAsUtc - Math.floor(now.getTime() / 1000) * 1000
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - offsetMs)
}

export type ActivityEvent = { session_id: string; event: string; source: string; created_at: string }
export type DayCounts = { sessions: Record<string, number>; sources: Record<string, number> }

/** Distinct browser sessions per event, and visit sources, for events in [from, to). */
export function countDay(events: ActivityEvent[], from: Date, to: Date): DayCounts {
  const byEvent = new Map<string, Set<string>>()
  const sources: Record<string, number> = {}
  for (const e of events) {
    const at = Date.parse(e.created_at)
    if (!(at >= from.getTime() && at < to.getTime())) continue
    if (!byEvent.has(e.event)) byEvent.set(e.event, new Set())
    const seen = byEvent.get(e.event)!
    if (seen.has(e.session_id)) continue
    seen.add(e.session_id)
    if (e.event === 'visit') sources[e.source] = (sources[e.source] ?? 0) + 1
  }
  return { sessions: Object.fromEntries([...byEvent].map(([k, v]) => [k, v.size])), sources }
}

export function countSince(rows: { created_at: string }[], from: Date, to: Date): number {
  return rows.filter(r => { const at = Date.parse(r.created_at); return at >= from.getTime() && at < to.getTime() }).length
}
