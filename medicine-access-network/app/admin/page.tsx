import type { Metadata } from 'next'
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

export const metadata: Metadata = { title: 'Admin' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const [
    { data: facilitatorStats },
    { data: userStats },
    { data: bookingStats },
    { data: pendingFacilitators },
    { data: recentlyReviewed },
  ] = await Promise.all([
    supabase.from('facilitator_profiles').select('verification_status'),
    supabase.from('users').select('role'),
    supabase.from('booking_requests').select('status'),
    supabase
      .from('facilitator_profiles')
      .select(
        'id, display_name, location, modalities, bio, safety_practices, years_experience, lineage_or_training, certifications, created_at, user_id'
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true }),
    supabase
      .from('facilitator_profiles')
      .select('id, display_name, verification_status, created_at')
      .in('verification_status', ['approved', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const counts = {
    facilitators: {
      pending: facilitatorStats?.filter((s) => s.verification_status === 'pending').length ?? 0,
      approved: facilitatorStats?.filter((s) => s.verification_status === 'approved').length ?? 0,
      rejected: facilitatorStats?.filter((s) => s.verification_status === 'rejected').length ?? 0,
    },
    users: {
      seekers: userStats?.filter((u) => u.role === 'seeker').length ?? 0,
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
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Total users',
            value: counts.users.total,
            sub: `${counts.users.seekers} seekers · ${counts.users.facilitators} facilitators`,
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
            label: 'Active guides',
            value: counts.facilitators.approved,
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
              <Card key={f.id} className="border-stone-200">
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
                    <Textarea
                      name="note"
                      placeholder="Optional note to record with this decision…"
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        name="status"
                        value="approved"
                        size="sm"
                        className="bg-emerald-700 text-xs hover:bg-emerald-800"
                      >
                        <CheckCircle className="mr-1.5 size-3.5" />
                        Approve
                      </Button>
                      <Button
                        type="submit"
                        name="status"
                        value="rejected"
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 hover:bg-red-50"
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
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 px-3 py-2"
                >
                  <span className="text-sm font-medium text-stone-800">
                    {f.display_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        f.verification_status === 'approved'
                          ? 'border-emerald-200 bg-emerald-50 text-xs text-emerald-700'
                          : 'border-red-200 bg-red-50 text-xs text-red-600'
                      }
                    >
                      {f.verification_status === 'approved' ? 'Approved' : 'Rejected'}
                    </Badge>
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
