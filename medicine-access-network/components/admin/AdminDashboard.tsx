import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { ADMIN_TIME_ZONE, type ActivityEvent } from '@/lib/today-activity'
import { RANGES, change, dailySeries, periodBounds, rate, summarize, type Range } from '@/lib/admin-dashboard'

const sourceLabels: Record<string, string> = { direct: 'Direct / app / unknown', instagram: 'Instagram', tiktok: 'TikTok', x: 'X / Twitter', youtube: 'YouTube', chatgpt: 'ChatGPT', linktree: 'Linktree', search: 'Search engines', other: 'Other sites (incl. Reddit web)' }
type Rows = { created_at: string }[]

function Delta({ current, previous, label }: { current: number; previous: number; label: string }) {
  const c = change(current, previous)
  if (!c) return <span className="text-xs text-stone-500">{label}: 0</span>
  const tone = c.delta > 0 ? 'text-emerald-800' : c.delta < 0 ? 'text-amber-800' : 'text-stone-500'
  return <span className="text-xs text-stone-500"><span className={`font-semibold ${tone}`}>{c.text}</span> vs {label} ({previous})</span>
}

export async function AdminDashboard({ range }: { range: Range }) {
  await requireRole('admin')
  const now = new Date()
  const bounds = periodBounds(range, now)
  const since = new Date(Math.min(bounds.previous.from.getTime(), bounds.chartDays[0].getTime())).toISOString()
  const compareLabel = range === 'today' ? 'this time yesterday' : `previous ${RANGES.find(r => r.value === range)!.days} days`

  let events: ActivityEvent[] | null = null
  let requests: Rows | null = null, applications: Rows | null = null, accounts: Rows | null = null
  let listings: { verification_status: string; visibility: string }[] | null = null
  try {
    const db = createAdminSupabaseClient()
    // Timestamps, event names, session IDs and coarse sources only.
    const [e, r, a, u, l] = await Promise.all([
      db.from('engagement_events').select('session_id, event, source, created_at').gte('created_at', since).limit(50000),
      db.from('booking_requests').select('created_at').gte('created_at', since).limit(10000),
      db.from('facilitator_profiles').select('created_at').gte('created_at', since).limit(10000),
      db.from('users').select('created_at').gte('created_at', since).limit(10000),
      db.from('facilitator_profiles').select('verification_status, visibility').limit(10000),
    ])
    if (!e.error) events = e.data as ActivityEvent[]
    if (!r.error) requests = r.data
    if (!a.error) applications = a.data
    if (!u.error) accounts = u.data
    if (!l.error) listings = l.data
  } catch { /* Sections below show "unavailable" individually. */ }

  const rows = { requests: requests ?? [], applications: applications ?? [], accounts: accounts ?? [] }
  const cur = events ? summarize(events, rows, bounds.current) : null
  const prev = events ? summarize(events, rows, bounds.previous) : null
  const series = events ? dailySeries(events, requests ?? [], bounds.chartDays, now) : null
  const maxVisitors = Math.max(1, ...(series ?? []).map(d => d.visitors))
  const pending = listings?.filter(l => l.verification_status === 'pending').length ?? null
  const published = listings?.filter(l => l.verification_status === 'approved' && l.visibility === 'public').length ?? null
  const visitors = cur?.sessions.visit ?? 0

  // Biggest proportional loss between consecutive funnel steps with traffic.
  let dropoff: { from: string; to: string; lost: number } | null = null
  if (cur) for (let i = 1; i < cur.funnel.length; i++) {
    const a = cur.funnel[i - 1], b = cur.funnel[i]
    if (a.value > 0 && (!dropoff || (a.value - b.value) / a.value > dropoff.lost)) dropoff = { from: a.label, to: b.label, lost: (a.value - b.value) / a.value }
  }
  const empty = cur?.sessions.search_empty ?? 0, searched = cur?.sessions.search_used ?? 0
  const dayFmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', { timeZone: ADMIN_TIME_ZONE, ...opts })

  const attention = [
    { label: 'Applications to review', value: pending, href: '#pending-applications', urgent: (pending ?? 0) > 0, tone: 'action', note: 'Approve or decline below' },
    { label: 'Inquiries received', value: requests ? cur?.inquiries ?? 0 : null, urgent: (cur?.inquiries ?? 0) > 0, tone: 'good', note: 'Stored requests to guides' },
    { label: 'Searches with no results', value: cur ? empty : null, urgent: empty > 0, tone: 'warning', note: searched ? `${rate(empty, searched)} of ${searched} searching visitors` : 'No searches yet' },
  ]

  return <section id="dashboard" aria-labelledby="dashboard-title" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Dashboard</p>
        <h2 id="dashboard-title" className="mt-1 text-2xl font-semibold text-stone-900">{range === 'today' ? dayFmt(now, { weekday: 'long', month: 'long', day: 'numeric' }) : `Last ${RANGES.find(r => r.value === range)!.days} days`}</h2>
        <p className="mt-1 text-sm text-stone-600">Cancún time · updated {now.toLocaleTimeString('en-US', { timeZone: ADMIN_TIME_ZONE, hour: 'numeric', minute: '2-digit' })}. Refresh for the latest.</p>
      </div>
      <nav aria-label="Dashboard period" className="flex gap-1 rounded-xl border border-stone-200 bg-white p-1">
        {RANGES.map(r => <Link key={r.value} href={`/admin?range=${r.value}#dashboard`} aria-current={range === r.value ? 'page' : undefined} className={`min-h-9 rounded-lg px-3 py-2 text-sm ${range === r.value ? 'bg-emerald-800 text-white' : 'text-stone-700'}`}>{r.label}</Link>)}
      </nav>
    </div>

    {/* 1. What needs action */}
    <div className="grid gap-3 sm:grid-cols-3">
      {attention.map(item => {
        const body = <>
          <p className="text-xs text-stone-600">{item.label}</p>
          <p className="mt-1 text-3xl font-semibold text-stone-900">{item.value ?? '–'}</p>
          <p className="mt-1 text-xs text-stone-500">{item.note}</p>
        </>
        // Green = good news, amber = needs attention; never color alone (the label says which).
        const cls = `block rounded-xl border p-4 ${!item.urgent ? 'border-stone-200 bg-white' : item.tone === 'warning' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600' : 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700'}`
        return item.href ? <a key={item.label} href={item.href} className={cls}>{body}</a> : <div key={item.label} className={cls}>{body}</div>
      })}
    </div>

    {/* 2. Funnel: where people stop */}
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="font-semibold text-stone-900">From visit to contact</h3>
      <p className="mt-1 text-sm text-stone-600">Browser sessions at each step, with change vs {compareLabel}.</p>
      {!cur || !prev ? <p className="mt-4 text-sm text-stone-500">Activity data is unavailable right now.</p> : <>
        <ol className="mt-4 space-y-3">
          {cur.funnel.map((step, i) => <li key={step.key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-stone-700">{i + 1}. {step.label}</span>
              <span className="whitespace-nowrap"><strong className="text-stone-900">{step.value}</strong>{i > 0 && <span className="ml-2 text-xs text-stone-500">{rate(step.value, visitors)} of visitors</span>}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-stone-100" aria-hidden="true"><div className="h-2 rounded-full bg-emerald-700" style={{ width: `${visitors ? Math.max(step.value ? 2 : 0, 100 * step.value / visitors) : 0}%` }} /></div>
            <div className="mt-1"><Delta current={step.value} previous={prev.funnel[i].value} label={compareLabel} /></div>
          </li>)}
        </ol>
        {dropoff && dropoff.lost > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Biggest drop-off: <strong>{dropoff.from}</strong> → <strong>{dropoff.to}</strong> ({Math.round(100 * dropoff.lost)}% did not continue).</p>}
      </>}
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      {/* 3. Trend */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-semibold text-stone-900">Visitors per day</h3>
        <p className="mt-1 text-sm text-stone-600">Last {bounds.chartDays.length} days. Spikes usually match outreach.</p>
        {!series ? <p className="mt-4 text-sm text-stone-500">Unavailable right now.</p> : <>
          <div className="mt-4 flex h-32 items-end gap-0.5 border-b border-stone-200" role="img" aria-label={`Visitors per day: ${series.map(d => `${dayFmt(d.day, { month: 'short', day: 'numeric' })} ${d.visitors}`).join(', ')}`}>
            {series.map((d, i) => <div key={i} className="group relative flex h-full flex-1 items-end" title={`${dayFmt(d.day, { weekday: 'short', month: 'short', day: 'numeric' })}: ${d.visitors} visitors, ${d.inquiries} inquiries`}>
              <div className={`w-full rounded-t ${i === series.length - 1 ? 'bg-emerald-900' : 'bg-emerald-700'}`} style={{ height: `${d.visitors ? Math.max(3, 100 * d.visitors / maxVisitors) : 0}%` }} />
            </div>)}
          </div>
          <div className="mt-1 flex justify-between text-xs text-stone-500"><span>{dayFmt(series[0].day, { month: 'short', day: 'numeric' })}</span><span>Peak {maxVisitors}</span><span>Today</span></div>
          <p className="mt-3 text-sm text-stone-700">Inquiries in this time: <strong>{series.reduce((n, d) => n + d.inquiries, 0)}</strong>{series.some(d => d.inquiries) && <span className="text-stone-500"> (on {series.filter(d => d.inquiries).map(d => dayFmt(d.day, { month: 'short', day: 'numeric' })).join(', ')})</span>}</p>
          <details className="mt-2 text-xs text-stone-600"><summary className="cursor-pointer">Show as table</summary>
            <table className="mt-2 w-full text-left"><thead><tr><th scope="col" className="py-1">Day</th><th scope="col">Visitors</th><th scope="col">Inquiries</th></tr></thead>
              <tbody>{series.map((d, i) => <tr key={i} className="border-t border-stone-100"><td className="py-1">{dayFmt(d.day, { weekday: 'short', month: 'short', day: 'numeric' })}</td><td>{d.visitors}</td><td>{d.inquiries}</td></tr>)}</tbody></table>
          </details>
        </>}
      </div>

      {/* 4. Sources */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="font-semibold text-stone-900">Where visitors came from</h3>
        <p className="mt-1 text-sm text-stone-600">Visits in this period by referring source.</p>
        {!cur ? <p className="mt-4 text-sm text-stone-500">Unavailable right now.</p> : !cur.sources.length ? <p className="mt-4 text-sm text-stone-500">No tracked visits in this period.</p> :
          <dl className="mt-4 space-y-3">{cur.sources.map(([key, n]) => <div key={key}>
            <div className="flex justify-between gap-3 text-sm"><dt className="text-stone-700">{sourceLabels[key] ?? 'Other sites'}</dt><dd className="font-semibold text-stone-900">{n} <span className="font-normal text-stone-500">· {rate(n, visitors)}</span></dd></div>
            <div className="mt-1.5 h-2 rounded-full bg-stone-100" aria-hidden="true"><div className="h-2 rounded-full bg-emerald-700" style={{ width: `${100 * n / Math.max(visitors, 1)}%` }} /></div>
          </div>)}</dl>}
        <p className="mt-4 text-xs text-stone-500">Reddit app visits usually appear as Direct; reddit.com visits as Other sites.</p>
      </div>
    </div>

    {/* 5. Supporting numbers */}
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Read a safety guide', value: cur ? cur.sessions.resource_view ?? 0 : undefined, prev: prev?.sessions.resource_view ?? 0 },
        { label: 'New guide applications', value: applications ? cur?.applications : undefined, prev: prev?.applications },
        { label: 'New accounts', value: accounts ? cur?.accounts : undefined, prev: prev?.accounts },
        { label: 'Published guides', value: published ?? undefined, note: pending ? `${pending} awaiting review` : 'None awaiting review' },
      ].map(s => <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4">
        <dt className="text-xs text-stone-600">{s.label}</dt>
        <dd className="mt-1 text-2xl font-semibold text-stone-900">{s.value ?? '–'}</dd>
        <dd className="mt-1">{'note' in s ? <span className="text-xs text-stone-500">{s.note}</span> : s.value !== undefined && <Delta current={s.value ?? 0} previous={s.prev ?? 0} label={compareLabel} />}</dd>
      </div>)}
    </dl>

    <p className="text-xs leading-relaxed text-stone-600">Activity numbers are browser sessions, not unique people, and exclude admin visits and browsers that ask not to be tracked. Inquiries, applications and accounts are database records and may include tests. Activity history is kept for 90 days. Definitions and the 90-day report are in “Full tracking report” at the bottom of this page.</p>
  </section>
}
