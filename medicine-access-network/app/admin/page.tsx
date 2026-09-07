import type { Metadata } from 'next'
import Image from 'next/image'
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { getProfileImageUrl } from '@/lib/profile-media'
import { getDirectContactLinks } from '@/lib/direct-contact'
import { isAdminNotificationConfigured } from '@/lib/admin-notifications'

export const metadata: Metadata = { title: 'Admin' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ notice?: string | string[] }> }) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice
  const notificationsConfigured = isAdminNotificationConfigured()
  const notices: Record<string, string> = {
    published: 'Profile approved and published in the public directory.',
    hidden: 'Review decision saved. The profile is hidden from the public directory.',
    invalid: 'The review decision was not valid. Please try again.',
    update_failed: 'The review decision could not be saved. Please try again.',
    note_failed: 'The review decision was saved, but the optional note could not be recorded.',
    notifications_sent: 'The email service accepted this batch of alerts. Other alerts may still be queued or delayed. Check your inbox and spam folder; inbox delivery is not confirmed here.',
    notifications_not_ready: 'No alerts were ready to send in this attempt. Delayed alerts may still be waiting; retry later.',
    notifications_pending: 'Some application alerts could not be sent yet. The applications remain available below. Please retry later.',
    notifications_unconfigured: 'Admin email alerts are not configured yet. Applications are still saved here for review.',
  }

  const [
    { data: facilitatorStats },
    { data: userStats },
    { data: bookingStats },
    { data: pendingFacilitators },
    { data: recentlyReviewed },
  ] = await Promise.all([
    supabase.from('facilitator_profiles').select('verification_status, visibility'),
    supabase.from('users').select('role'),
    supabase.from('booking_requests').select('status'),
    supabase
      .from('facilitator_profiles')
      .select(
        'id, display_name, location, modalities, bio, safety_practices, years_experience, lineage_or_training, certifications, created_at, user_id, image_paths, whatsapp_url, signal_url, telegram_url'
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('facilitator_profiles')
      .select('id, display_name, verification_status, visibility, created_at')
      .in('verification_status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const counts = {
    facilitators: {
      pending: facilitatorStats?.filter((s) => s.verification_status === 'pending').length ?? 0,
      published: facilitatorStats?.filter((s) => s.verification_status === 'approved' && s.visibility === 'public').length ?? 0,
      rejected: facilitatorStats?.filter((s) => s.verification_status === 'rejected').length ?? 0,
    },
    users: {
      facilitators: userStats?.filter((u) => u.role === 'facilitator').length ?? 0,
      total: userStats?.length ?? 0,
    },
    bookings: {
      pending: bookingStats?.filter((b) => b.status === 'pending').length ?? 0,
      accepted: bookingStats?.filter((b) => b.status === 'accepted').length ?? 0,
      total: bookingStats?.length ?? 0,
    },
  }

  return (
    <div className="space-y-8">
      {notice && notices[notice] && (
        <p role={['published', 'hidden', 'notifications_sent', 'notifications_not_ready'].includes(notice) ? 'status' : 'alert'} className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
          {notices[notice]}
        </p>
      )}
      <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Application email alerts</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            {notificationsConfigured
              ? 'New applications and submitted changes alert the configured admin inbox. If an email is delayed, you can still review the application here.'
              : 'Admin email alerts are not configured yet. Applications are still saved here for review.'}
            {' '}Retry attempts a small batch of queued alerts.
          </p>
        </div>
        <form action="/api/admin/notifications" method="POST" className="shrink-0">
          <Button type="submit" name="action" value="retry" variant="outline" className="min-h-11 w-full sm:w-auto">Retry pending alerts</Button>
        </form>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Total accounts',
            value: counts.users.total,
            sub: `${counts.users.facilitators} guide accounts · visitors need no account`,
            icon: Users,
            color: 'text-stone-500',
          },
          {
            label: 'Pending review',
            value: counts.facilitators.pending,
            sub: 'Applications awaiting decision',
            icon: Clock,
            color: 'text-amber-600',
            highlight: counts.facilitators.pending > 0,
          },
          {
            label: 'Published guides',
            value: counts.facilitators.published,
            sub: `${counts.facilitators.rejected} rejected`,
            icon: CheckCircle,
            color: 'text-emerald-600',
          },
          {
            label: 'Conversation requests',
            value: counts.bookings.total,
            sub: `${counts.bookings.pending} pending · ${counts.bookings.accepted} accepted`,
            icon: CalendarDays,
            color: 'text-stone-500',
          },
        ].map(({ label, value, sub, icon: Icon, color, highlight }) => (
          <Card
            key={label}
            className={`border-stone-200 ${highlight ? 'ring-1 ring-amber-300' : ''}`}
          >
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-stone-400">
                <Icon className={`size-3.5 ${color}`} />
                <span className="text-xs">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${highlight ? 'text-amber-600' : 'text-stone-900'}`}>
                {value}
              </p>
              <p className="mt-0.5 text-xs text-stone-400">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Pending applications */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
          <Shield className="size-5 text-amber-500" />
          Pending applications
          {counts.facilitators.pending > 0 && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-xs text-amber-700"
            >
              {counts.facilitators.pending}
            </Badge>
          )}
        </h2>

        {!pendingFacilitators || pendingFacilitators.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="py-10 text-center text-stone-500">
              No pending applications — all caught up.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingFacilitators.map((f) => (
              <Card key={f.id} id={`application-${f.id}`} className="scroll-mt-24 border-stone-200">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{f.display_name}</CardTitle>
                      {f.location && (
                        <p className="text-sm text-stone-500">{f.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <Clock className="size-3" />
                      {formatDate(f.created_at)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Profile photos</h3>
                    {(f.image_paths ?? []).length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {(f.image_paths as string[]).slice(0, 5).map((path, index) => {
                          const url = getProfileImageUrl(path)
                          return url ? <a key={path} href={url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                            <Image src={url} alt={`${f.display_name} — submitted photo ${index + 1}`} width={400} height={300} unoptimized className="aspect-[4/3] w-full object-contain" />
                            <span className="block p-2 text-xs text-stone-600">{index === 0 ? 'Primary photo' : `Photo ${index + 1}`} · open in new tab</span>
                          </a> : null
                        })}
                      </div>
                    ) : <p className="text-sm text-amber-800">A profile photo is required before publication.</p>}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Public direct contact links</h3>
                    {getDirectContactLinks(f).length > 0 ? <>
                      <div className="flex flex-wrap gap-3">
                        {getDirectContactLinks(f).map(({ platform, label, href }) => <a key={platform} href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex min-h-11 items-center break-all rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-emerald-800 underline underline-offset-4">{label} · open in app or new tab</a>)}
                      </div>
                      <p className="mt-2 text-xs text-stone-600">The link format is checked. Confirm the destination belongs to this guide during review.</p>
                    </> : <p className="text-sm text-stone-600">No direct contact links supplied; the website inquiry form remains available.</p>}
                  </div>
                  {/* Modalities */}
                  {(f.modalities ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(f.modalities as string[]).map((m) => (
                        <Badge
                          key={m}
                          variant="secondary"
                          className="bg-stone-100 text-xs text-stone-600"
                        >
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Bio */}
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Bio
                    </p>
                    <p className="text-sm text-stone-700">{f.bio}</p>
                  </div>

                  {/* Training */}
                  {f.lineage_or_training && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                        Training / Lineage
                      </p>
                      <p className="text-sm text-stone-700">{f.lineage_or_training}</p>
                    </div>
                  )}

                  {/* Safety */}
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">
                      Safety practices
                    </p>
                    <p className="text-sm text-stone-700">{f.safety_practices}</p>
                  </div>

                  {/* Experience */}
                  {f.years_experience != null && (
                    <p className="text-xs text-stone-400">
                      {f.years_experience} year{f.years_experience !== 1 ? 's' : ''} experience
                    </p>
                  )}

                  <Separator />

                  {/* Approve / Reject form */}
                  <form
                    action={`/api/admin/facilitators/${f.id}`}
                    method="POST"
                    className="space-y-3"
                  >
                    <label htmlFor={`review-note-${f.id}`} className="text-sm font-medium text-stone-700">Review note (optional)</label>
                    <Textarea
                      id={`review-note-${f.id}`}
                      name="note"
                      maxLength={1000}
                      placeholder="Optional note to record with this decision…"
                      rows={2}
                      className="text-base sm:text-sm"
                    />
                    <p className="text-xs leading-relaxed text-stone-600">Approving publishes this profile so visitors can view it and send conversation requests. Rejecting keeps it hidden.</p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="submit"
                        name="status"
                        value="approved"
                        size="sm"
                        className="min-h-12 w-full bg-emerald-700 text-sm hover:bg-emerald-800 sm:w-auto"
                      >
                        <CheckCircle className="mr-1.5 size-3.5" />
                        Approve &amp; publish
                      </Button>
                      <Button
                        type="submit"
                        name="status"
                        value="rejected"
                        size="sm"
                        variant="outline"
                        className="min-h-12 w-full text-sm text-red-600 hover:bg-red-50 sm:w-auto"
                      >
                        <XCircle className="mr-1.5 size-3.5" />
                        Reject
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recently reviewed */}
      {recentlyReviewed && recentlyReviewed.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-base font-semibold text-stone-900">
              Recently reviewed
            </h2>
            <div className="space-y-2">
              {recentlyReviewed.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col items-start justify-between gap-3 rounded-lg border border-stone-100 px-3 py-3 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 break-words text-sm font-medium text-stone-800">
                    {f.display_name}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        f.verification_status === 'approved'
                          ? 'border-emerald-200 bg-emerald-50 text-xs text-emerald-700'
                          : 'border-red-200 bg-red-50 text-xs text-red-600'
                      }
                    >
                      {f.verification_status === 'approved' ? f.visibility === 'public' ? 'Published' : 'Approved · hidden' : 'Rejected · hidden'}
                    </Badge>
                    {f.verification_status === 'approved' && f.visibility !== 'public' && (
                      <form action={`/api/admin/facilitators/${f.id}`} method="POST">
                        <Button type="submit" name="status" value="approved" variant="outline" className="min-h-11">Publish profile</Button>
                      </form>
                    )}
                    <span className="text-xs text-stone-400">
                      {formatDate(f.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
