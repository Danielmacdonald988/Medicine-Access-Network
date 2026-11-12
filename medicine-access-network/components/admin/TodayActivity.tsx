import { requireRole } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { ADMIN_TIME_ZONE, countDay, countSince, startOfLocalDay, type ActivityEvent } from '@/lib/today-activity'

const sourceLabels: Record<string, string> = { direct: 'Direct / unknown', instagram: 'Instagram', tiktok: 'TikTok', x: 'X / Twitter', youtube: 'YouTube', chatgpt: 'ChatGPT', linktree: 'Linktree', search: 'Search engines', other: 'Other referrals' }

// Same event names as the engagement panel below, counted per browser session.
const tiles: { key: string; label: string; from: 'events' | 'requests' | 'applications' | 'accounts'; highlight?: boolean }[] = [
  { key: 'visit', label: 'Visitors', from: 'events' },
  { key: 'directory_view', label: 'Browsed the directory', from: 'events' },
  { key: 'profile_view', label: 'Opened a guide profile', from: 'events' },
  { key: 'resource_view', label: 'Read a safety guide', from: 'events' },
  { key: 'search_empty', label: 'Saw no search results', from: 'events' },
  { key: 'contact_started', label: 'Started an inquiry', from: 'events' },
  { key: 'requests', label: 'Inquiries received', from: 'requests', highlight: true },
  { key: 'direct_contact', label: 'Tapped a messaging link', from: 'events', highlight: true },
  { key: 'applications', label: 'New guide applications', from: 'applications', highlight: true },
  { key: 'accounts', label: 'New accounts', from: 'accounts' },
]

export async function TodayActivity() {
  await requireRole('admin')
  const now = new Date()
  const today = startOfLocalDay(now)
  const yesterday = startOfLocalDay(new Date(today.getTime() - 60 * 60 * 1000))
  const since = yesterday.toISOString()

  let events: ActivityEvent[] | null = null
  let requests: { created_at: string }[] | null = null
  let applications: { created_at: string }[] | null = null
  let accounts: { created_at: string }[] | null = null
  try {
    const db = createAdminSupabaseClient()
    // Counts and coarse sources only: no request content, names or guide IDs.
    const [e, r, a, u] = await Promise.all([
      db.from('engagement_events').select('session_id, event, source, created_at').gte('created_at', since).limit(20000),
      db.from('booking_requests').select('created_at').gte('created_at', since).limit(5000),
      db.from('facilitator_profiles').select('created_at').gte('created_at', since).limit(5000),
      db.from('users').select('created_at').gte('created_at', since).limit(5000),
    ])
    if (!e.error) events = e.data as ActivityEvent[]
    if (!r.error) requests = r.data
    if (!a.error) applications = a.data
    if (!u.error) accounts = u.data
  } catch { /* Each tile shows "–" when its source is unavailable. */ }

  const todayCounts = events ? countDay(events, today, now) : null
  const yesterdayCounts = events ? countDay(events, yesterday, today) : null
  const value = (tile: typeof tiles[number], from: Date, to: Date, counts: typeof todayCounts) => {
    if (tile.from === 'events') return counts ? counts.sessions[tile.key] ?? 0 : null
    const rows = tile.from === 'requests' ? requests : tile.from === 'applications' ? applications : accounts
    return rows ? countSince(rows, from, to) : null
  }
  const dateLabel = now.toLocaleDateString('en-US', { timeZone: ADMIN_TIME_ZONE, weekday: 'long', month: 'long', day: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-US', { timeZone: ADMIN_TIME_ZONE, hour: 'numeric', minute: '2-digit' })
  const sources = Object.entries(todayCounts?.sources ?? {}).sort((x, y) => y[1] - x[1])

  return <section id="today" aria-labelledby="today-title" className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Today</p>
        <h2 id="today-title" className="mt-1 text-2xl font-semibold text-stone-900">{dateLabel}</h2>
      </div>
      <p className="text-sm text-stone-600">Since midnight Cancún time · updated {timeLabel}. Refresh for the latest.</p>
    </div>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map(tile => {
        const t = value(tile, today, now, todayCounts)
        const y = value(tile, yesterday, today, yesterdayCounts)
        return <div key={tile.key} className={`rounded-xl border bg-white p-4 ${tile.highlight && t ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-stone-200'}`}>
          <dt className="text-xs text-stone-600">{tile.label}</dt>
          <dd className="mt-2 text-3xl font-semibold text-stone-900">{t ?? '–'}</dd>
          <dd className="mt-1 text-xs text-stone-500">Yesterday: {y ?? '–'}</dd>
        </div>
      })}
    </dl>
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-stone-900">Where today’s visitors came from</h3>
      {!todayCounts ? <p className="mt-2 text-sm text-stone-500">Unavailable right now.</p>
        : !sources.length ? <p className="mt-2 text-sm text-stone-500">No tracked visits yet today.</p>
        : <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">{sources.map(([key, n]) => <li key={key}><span className="text-stone-600">{sourceLabels[key] ?? 'Other referrals'}</span> <strong>{n}</strong></li>)}</ul>}
    </div>
    <p className="text-xs leading-relaxed text-stone-600">Activity counts are browser sessions, not unique people, and exclude admin visits and browsers that ask not to be tracked. Inquiries received, guide applications and new accounts are database records and may include tests. Details and longer periods are in the engagement section below.</p>
  </section>
}
