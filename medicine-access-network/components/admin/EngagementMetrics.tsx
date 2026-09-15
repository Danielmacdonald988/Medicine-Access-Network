import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabaseAdmin'
import { APPLICATION_STEPS } from '@/lib/engagement'

type Funnel = { started: number; completed: number; pending: number; dropped: number; matured: number; matured_completed: number }
type Summary = { counts: Record<string, number>; funnels: Record<string, Funnel>; last_steps: Record<string, number>; sources: Record<string, number>; devices: Record<string, number>; first_event: string | null; latest_event: string | null }
const empty: Funnel = { started: 0, completed: 0, pending: 0, dropped: 0, matured: 0, matured_completed: 0 }
const labels: Record<string, string> = { direct: 'Direct / unknown', instagram: 'Instagram', linktree: 'Linktree', search: 'Search engines', other: 'Other referrals', mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' }

function FunnelCard({ title, description, funnel, completeLabel }: { title: string; description: string; funnel: Funnel; completeLabel: string }) {
  return <div className="rounded-2xl border border-stone-200 bg-white p-5">
    <h3 className="font-semibold text-stone-900">{title}</h3>
    <p className="mt-1 text-sm text-stone-600">{description}</p>
    <dl className="mt-5 grid grid-cols-2 gap-4">
      {[["Started", funnel.started], [completeLabel, funnel.completed], ["Still within 24 hours", funnel.pending], ["Dropped off after 24 hours", funnel.dropped]].map(([label, value]) => <div key={label}><dt className="text-xs text-stone-600">{label}</dt><dd className={`mt-1 text-3xl font-semibold ${label === 'Dropped off after 24 hours' ? 'text-amber-800' : 'text-stone-900'}`}>{value}</dd></div>)}
    </dl>
    <p className="mt-5 border-t border-stone-100 pt-3 text-sm text-stone-600">24-hour completion rate: <strong className="text-emerald-800">{funnel.matured ? `${Math.round(100 * funnel.matured_completed / funnel.matured)}%` : 'Waiting for a full day'}</strong></p>
  </div>
}

export async function EngagementMetrics({ days }: { days: number }) {
  // Guard here too: service-role reads must not depend on a layout alone.
  await requireRole('admin')
  let summary: Summary | null = null
  try {
    const { data, error } = await createAdminSupabaseClient().rpc('engagement_summary', { p_days: days })
    if (!error && data && typeof data === 'object' && data.counts && data.funnels) summary = data as Summary
  } catch { /* Keep moderation usable when analytics is unavailable. */ }

  return <section id="engagement" aria-labelledby="engagement-title" className="space-y-5 scroll-mt-24">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Audience & growth</p><h2 id="engagement-title" className="mt-1 text-2xl font-semibold text-stone-900">Engagement & signup drop-off</h2><p className="mt-2 text-sm text-stone-600">Understand where visitors engage and where applications stop.</p></div>
      <nav aria-label="Engagement reporting period" className="flex flex-wrap gap-2">{[7,30,90].map(value => <Link key={value} href={`/admin?days=${value}#engagement`} aria-current={days === value ? 'page' : undefined} className={`rounded-lg border px-3 py-2 text-sm ${days === value ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-stone-200 bg-white text-stone-700'}`}>{value} days</Link>)}</nav>
    </div>
    {!summary ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Engagement metrics are temporarily unavailable. Refresh to try again. Account and application management are still available below.</p> : <>
      {!summary.first_event && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Tracking is ready. The first visitor activity will appear here after it is recorded. Earlier activity cannot be reconstructed.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelCard title="Account signup" description="Starts when someone interacts with the signup form." funnel={summary.funnels.signup_started || empty} completeLabel="Signup accepted" />
        <FunnelCard title="Facilitator application" description="New applications only; profile edits are excluded." funnel={summary.funnels.application_started || empty} completeLabel="Application submitted" />
      </div>
      <p className="text-xs leading-relaxed text-stone-600">A drop-off means no tracked completion within 24 hours of the first interaction in the same browser tab. It does not prove someone closed the page. Signup accepted means the signup service returned success; email confirmation and a newly created account are not verified by this signal. Completion rates exclude starts less than 24 hours old.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {[
          ['visit','Tracked sessions'],['directory_view','Directory visitors'],['profile_view','Profile viewers'],['resource_view','Resource readers'],
          ['search_used','Used search / filters'],['search_empty','Saw no search results'],['signup_view','Signup page visitors'],['signup_error','Signup errors'],
          ['contact_started','Started a contact request'],['contact_sent','Sent a contact request'],['contact_error','Contact errors'],['direct_contact','Direct contact clicks'],['guide_saved','Saved a guide'],['application_error','Application save errors'],
        ].map(([key,label]) => <div key={key} className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-600">{label}</p><p className="mt-2 text-2xl font-semibold text-stone-900">{summary.counts[key] || 0}</p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 lg:col-span-1"><h3 className="font-semibold">Where applications stopped</h3><p className="mt-1 text-xs text-stone-600">Furthest step reached by sessions that dropped off.</p><ol className="mt-4 space-y-2">{APPLICATION_STEPS.map((title,index) => <li key={title} className="flex justify-between gap-3 text-sm"><span className="text-stone-600">{index+1}. {title}</span><strong>{summary.last_steps[String(index+1)] || 0}</strong></li>)}</ol></div>
        {(['sources','devices'] as const).map(key => <div key={key} className="rounded-xl border border-stone-200 bg-white p-5"><h3 className="font-semibold">{key === 'sources' ? 'How visitors found you' : 'Visitor devices'}</h3><dl className="mt-4 space-y-4">{Object.entries(summary[key]).sort((a,b) => b[1]-a[1]).map(([label,count]) => <div key={label}><div className="flex justify-between gap-3 text-sm"><dt className="text-stone-600">{labels[label] || label}</dt><dd className="font-semibold">{count}</dd></div><div className="mt-2 h-1.5 rounded-full bg-stone-100"><div className="h-1.5 rounded-full bg-emerald-700" style={{width: `${Math.min(100,100*count/Math.max(summary.counts.visit || 0,1))}%`}} /></div></div>)}</dl>{!Object.keys(summary[key]).length && <p className="mt-3 text-sm text-stone-500">No tracked visits in this period.</p>}</div>)}
      </div>
      <details className="rounded-xl border border-stone-200 p-4 text-sm text-stone-600"><summary className="cursor-pointer font-medium text-stone-800">How to read these numbers</summary><div className="mt-3 space-y-2">
        <p>Counts represent browser-tab sessions, not unique people or total clicks. Each action is counted once per session. A session lasts up to 24 hours; another tab, browser, or device can count separately. Referrals use the first referring site, which may be unavailable or show Linktree instead of Instagram.</p>
        <p>Admin activity, preview deployments, and browsers requesting Do Not Track or Global Privacy Control are excluded. Blockers and network failures can reduce counts. Direct contact clicks do not confirm a message was sent. These are activity signals, not audited transaction totals.</p>
        <p>Only action names, numbered steps, broad referral sources and device types are stored. No names, emails, messages, search text, specific guide IDs, or full URLs are collected by this feature. Event history is retained for up to 90 days, with cleanup when new activity arrives.</p>
        <p>Earliest retained activity: {summary.first_event ? new Date(summary.first_event).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC' : 'None yet'}. Latest: {summary.latest_event ? new Date(summary.latest_event).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC' : 'None yet'}.</p>
      </div></details>
    </>}
  </section>
}
