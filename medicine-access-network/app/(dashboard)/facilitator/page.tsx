import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Star,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const metadata: Metadata = { title: 'Guide dashboard' }

// ─── Status display config ────────────────────────────────────────────────────

const requestStatusConfig = {
  pending:   { label: 'New request',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:  { label: 'Accepted',     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined:  { label: 'Declined',     color: 'bg-red-50 text-red-600 border-red-200' },
  completed: { label: 'Completed',    color: 'bg-stone-100 text-stone-500 border-stone-200' },
} as const

const verificationConfig = {
  pending:  { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     label: 'Awaiting review' },
  approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Approved' },
  rejected: { icon: XCircle,     color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         label: 'Not approved' },
} as const

// ─── Action buttons (plain forms — no JS required) ────────────────────────────

function StatusFormButton({
  requestId,
  status,
  label,
  variant = 'default',
  className = '',
}: {
  requestId: string
  status: string
  label: string
  variant?: 'default' | 'outline'
  className?: string
}) {
  return (
    <form action={`/api/booking-requests/${requestId}`} method="POST">
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant} className={`text-xs ${className}`}>
        {label}
      </Button>
    </form>
  )
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPreferredFormat(f: string) {
  return f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
        />
      ))}
    </span>
  )
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  req,
  showActions,
}: {
  req: {
    id: string
    requested_service: string
    message: string
    preferred_format: string
    preferred_time_window: string | null
    status: string
    created_at: string
  }
  showActions: boolean
}) {
  const config = requestStatusConfig[req.status as keyof typeof requestStatusConfig]

  return (
    <Card
      className={`border-stone-200 ${req.status === 'pending' ? 'ring-1 ring-amber-200' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-stone-900">
                {req.requested_service}
              </p>
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
              <span>{formatPreferredFormat(req.preferred_format)}</span>
              {req.preferred_time_window && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {req.preferred_time_window}
                </span>
              )}
              <span>{formatDate(req.created_at)}</span>
            </div>
            <p className="line-clamp-2 text-sm text-stone-600">{req.message}</p>
          </div>

          {showActions && (
            <div className="flex shrink-0 flex-col gap-2">
              {req.status === 'pending' && (
                <>
                  <StatusFormButton
                    requestId={req.id}
                    status="accepted"
                    label="Accept"
                    className="bg-emerald-700 hover:bg-emerald-800"
                  />
                  <StatusFormButton
                    requestId={req.id}
                    status="declined"
                    label="Decline"
                    variant="outline"
                  />
                </>
              )}
              {req.status === 'accepted' && (
                <StatusFormButton
                  requestId={req.id}
                  status="completed"
                  label="Mark completed"
                  variant="outline"
                  className="text-stone-500"
                />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FacilitatorDashboard() {
  const user = await requireRole('facilitator')
  const supabase = await createServerSupabaseClient()

  const [
    { data: facilitatorProfile },
    { data: incomingRequests },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('facilitator_profiles')
      .select(
        'id, display_name, verification_status, modalities, avatar_url, hourly_rate, donation_based'
      )
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('booking_requests')
      .select(
        'id, requested_service, message, preferred_format, preferred_time_window, status, created_at'
      )
      .eq('facilitator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('reviews')
      .select('id, rating, safety_rating, integration_rating, text, created_at')
      .eq('facilitator_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const hasProfile = !!facilitatorProfile
  const firstName = user.full_name.split(' ')[0] || 'there'

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null

  const pendingRequests = incomingRequests?.filter((r) => r.status === 'pending') ?? []
  const acceptedRequests = incomingRequests?.filter((r) => r.status === 'accepted') ?? []
  const pastRequests =
    incomingRequests?.filter(
      (r) => r.status === 'completed' || r.status === 'declined'
    ) ?? []

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-emerald-100 font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-stone-500">Guide dashboard</p>
          </div>
        </div>
        {facilitatorProfile?.verification_status === 'approved' && (
          <Button size="sm" variant="outline" asChild className="shrink-0">
            <Link href={`/facilitators/${facilitatorProfile.id}`}>
              Public profile
              <ArrowRight className="ml-1 size-3" />
            </Link>
          </Button>
        )}
      </div>

      {/* No profile nudge */}
      {!hasProfile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Complete your guide application
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Submit your profile for admin review to appear publicly.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
              asChild
            >
              <Link href="/onboarding/facilitator">Apply now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {hasProfile && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Pending',
              value: pendingRequests.length,
              icon: Clock,
              highlight: pendingRequests.length > 0,
            },
            {
              label: 'Accepted',
              value: acceptedRequests.length,
              icon: CheckCircle,
              highlight: false,
            },
            {
              label: 'Reviews',
              value: reviews?.length ?? 0,
              icon: Star,
              highlight: false,
            },
            {
              label: 'Avg rating',
              value: avgRating ? avgRating.toFixed(1) : '—',
              icon: Star,
              highlight: false,
            },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <Card
              key={label}
              className={`border-stone-200 ${highlight ? 'ring-1 ring-amber-300' : ''}`}
            >
              <CardContent className="p-4">
                <div className="mb-1 flex items-center gap-2 text-stone-400">
                  <Icon className="size-3.5" />
                  <span className="text-xs">{label}</span>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    highlight ? 'text-amber-600' : 'text-stone-900'
                  }`}
                >
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verification status */}
      {hasProfile && (
        <>
          {(() => {
            const status =
              facilitatorProfile.verification_status as keyof typeof verificationConfig
            const cfg = verificationConfig[status]
            const Icon = cfg.icon
            return (
              <Card className={`border ${cfg.bg}`}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className={`size-5 shrink-0 ${cfg.color}`} />
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Profile status:{' '}
                      <span className={cfg.color}>{cfg.label}</span>
                    </p>
                    {status === 'pending' && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        Under review — typically 3–5 business days.
                      </p>
                    )}
                    {status === 'rejected' && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        Check your email for feedback, then{' '}
                        <Link
                          href="/onboarding/facilitator"
                          className="underline hover:text-emerald-700"
                        >
                          update your application
                        </Link>
                        .
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </>
      )}

      {hasProfile && <Separator />}

      {/* Pending requests */}
      {hasProfile && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900">
            New requests
            {pendingRequests.length > 0 && (
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-xs text-amber-700"
              >
                {pendingRequests.length}
              </Badge>
            )}
          </h2>

          {pendingRequests.length === 0 ? (
            <Card className="border-dashed border-stone-200">
              <CardContent className="py-10 text-center">
                <MessageSquare className="mx-auto mb-3 size-8 text-stone-300" />
                <p className="text-stone-500">No new requests.</p>
                {facilitatorProfile?.verification_status !== 'approved' && (
                  <p className="mt-1 text-sm text-stone-400">
                    Once your profile is approved, seekers can send you requests.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <RequestCard key={req.id} req={req} showActions />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accepted requests */}
      {hasProfile && acceptedRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Accepted
          </h2>
          <div className="space-y-3">
            {acceptedRequests.map((req) => (
              <RequestCard key={req.id} req={req} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Past requests */}
      {hasProfile && pastRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Past requests
          </h2>
          <div className="space-y-3">
            {pastRequests.map((req) => (
              <RequestCard key={req.id} req={req} showActions={false} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {hasProfile && (
        <>
          <Separator />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Reviews</h2>
              {avgRating && (
                <div className="flex items-center gap-2">
                  <StarRow rating={Math.round(avgRating)} />
                  <span className="text-sm font-medium text-stone-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-400">
                    ({reviews?.length})
                  </span>
                </div>
              )}
            </div>

            {!reviews || reviews.length === 0 ? (
              <Card className="border-dashed border-stone-200">
                <CardContent className="py-10 text-center">
                  <Star className="mx-auto mb-3 size-8 text-stone-300" />
                  <p className="text-stone-500">No reviews yet.</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Reviews appear here after seekers complete a conversation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <Card key={r.id} className="border-stone-200">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <StarRow rating={r.rating} />
                          <span className="text-xs text-stone-400">
                            {formatDate(r.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-stone-700">{r.text}</p>
                        <div className="flex gap-4 text-xs text-stone-400">
                          <span className="flex items-center gap-1">
                            <Shield className="size-3" />
                            Safety: {r.safety_rating}/5
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            Integration: {r.integration_rating}/5
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer */}
      {hasProfile && (
        <div className="border-t border-stone-100 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-stone-400 hover:text-stone-700"
            asChild
          >
            <Link href="/onboarding/facilitator">Edit profile</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
