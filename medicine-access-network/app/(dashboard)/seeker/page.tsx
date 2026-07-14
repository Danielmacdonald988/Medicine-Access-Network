import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
  ArrowRight,
  Video,
  Phone,
  Users,
  Mail,
  Calendar,
  HeartHandshake,
  ExternalLink,
  PenLine,
} from 'lucide-react'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Your dashboard' }

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Awaiting response',
    description: 'Your request has been sent. The guide will respond if there is a good fit.',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  accepted: {
    icon: CheckCircle,
    label: 'Accepted',
    description: 'The guide has agreed to connect with you.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  declined: {
    icon: XCircle,
    label: 'Declined',
    description: "This guide isn't the right fit right now. You can browse other guides.",
    color: 'bg-red-50 text-red-600 border-red-200',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    description: 'This conversation has been marked as complete.',
    color: 'bg-stone-100 text-stone-500 border-stone-200',
  },
} as const

// ─── Format helpers ───────────────────────────────────────────────────────────

const formatIcons: Record<string, typeof Video> = {
  video: Video,
  voice: Phone,
  in_person: Users,
  async: Mail,
}

function formatLabel(f: string) {
  const labels: Record<string, string> = {
    video: 'Video call',
    voice: 'Voice call',
    in_person: 'In person',
    async: 'Async message',
  }
  return labels[f] ?? f
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  req,
  fp,
  canReview,
}: {
  req: {
    id: string
    requested_service: string
    message: string
    preferred_format: string
    preferred_time_window: string | null
    status: string
    created_at: string
    facilitator_id: string
  }
  fp: { id: string; display_name: string } | undefined
  canReview?: boolean
}) {
  const config = statusConfig[req.status as keyof typeof statusConfig]
  const StatusIcon = config.icon
  const FormatIcon = formatIcons[req.preferred_format] ?? Mail

  return (
    <Card
      className={`border-stone-200 ${
        req.status === 'pending' || req.status === 'accepted' ? 'ring-1 ring-stone-200' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Top row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-stone-900">{req.requested_service}</p>
              {fp && (
                <Link
                  href={`/facilitators/${fp.id}`}
                  className="mt-0.5 text-sm text-emerald-700 hover:underline"
                >
                  {fp.display_name}
                </Link>
              )}
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${config.color}`}>
              <StatusIcon className="mr-1 size-3" />
              {config.label}
            </Badge>
          </div>

          <p className="text-xs text-stone-500">{config.description}</p>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <FormatIcon className="size-3" />
              {formatLabel(req.preferred_format)}
            </span>
            {req.preferred_time_window &&
              req.preferred_time_window !== 'No preference — flexible' && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {req.preferred_time_window}
                </span>
              )}
            <span>{formatDate(req.created_at)}</span>
          </div>

          <p className="line-clamp-2 text-sm text-stone-500">{req.message}</p>

          {req.status === 'accepted' && fp && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-emerald-600 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              <Link href={`/facilitators/${fp.id}`}>
                View guide profile
                <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          )}

          {req.status === 'completed' && canReview && (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-stone-300 text-xs text-stone-600 hover:bg-stone-50"
            >
              <Link href={`/seeker/review/${req.id}`}>
                <PenLine className="mr-1 size-3" />
                Leave a review
              </Link>
            </Button>
          )}

          {req.status === 'completed' && !canReview && (
            <p className="text-xs text-stone-400">Review submitted</p>
          )}

          {req.status === 'declined' && (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              <Link href="/facilitators">Browse other guides</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Safety resources ─────────────────────────────────────────────────────────

const SAFETY_RESOURCES = [
  {
    name: '988 Suicide & Crisis Lifeline',
    description: 'Call or text 988. Available 24/7.',
    href: 'https://988lifeline.org',
  },
  {
    name: 'Fireside Project',
    description: 'Psychedelic support line: 62-FIRESIDE (623-473-7433).',
    href: 'https://firesideproject.org',
  },
  {
    name: 'Zendo Project',
    description: 'Psychedelic harm reduction training and support.',
    href: 'https://zendoproject.org',
  },
  {
    name: 'MAPS',
    description: 'Research and resources on psychedelic-assisted therapy.',
    href: 'https://maps.org',
  },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeekerDashboard() {
  const user = await requireRole('seeker')
  const supabase = await createServerSupabaseClient()

  const [{ data: seekerProfile }, { data: conversationRequests }, { data: reviewedRequests }] =
    await Promise.all([
      supabase
        .from('seeker_profiles')
        .select('display_name, experience_level, preferred_modalities')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('booking_requests')
        .select(
          'id, requested_service, message, preferred_format, preferred_time_window, status, created_at, facilitator_id'
        )
        .eq('seeker_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('reviews')
        .select('booking_request_id')
        .eq('seeker_id', user.id),
    ])

  const reviewedSet = new Set((reviewedRequests ?? []).map((r) => r.booking_request_id))

  const facilitatorIds = [
    ...new Set(conversationRequests?.map((r) => r.facilitator_id) ?? []),
  ]
  const { data: facilitatorProfiles } =
    facilitatorIds.length > 0
      ? await supabase
          .from('facilitator_profiles')
          .select('user_id, id, display_name')
          .in('user_id', facilitatorIds)
      : { data: [] }

  const facilitatorMap = Object.fromEntries(
    (facilitatorProfiles ?? []).map((fp) => [fp.user_id, fp])
  )

  const hasProfile = !!seekerProfile
  const firstName = user.full_name.split(' ')[0] || 'there'

  const activeRequests =
    conversationRequests?.filter(
      (r) => r.status === 'pending' || r.status === 'accepted'
    ) ?? []
  const pastRequests =
    conversationRequests?.filter(
      (r) => r.status === 'completed' || r.status === 'declined'
    ) ?? []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-stone-500">Your seeker dashboard</p>
        </div>
        <Button
          className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
          size="sm"
          asChild
        >
          <Link href="/facilitators">
            <Search className="mr-1.5 size-3.5" />
            Find a guide
          </Link>
        </Button>
      </div>

      {/* Profile completeness nudge */}
      {!hasProfile && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-amber-900">
                Complete your profile
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Helps guides understand your needs before you connect.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-amber-400 text-amber-800 hover:bg-amber-100"
              asChild
            >
              <Link href="/onboarding/seeker">
                Set up profile
                <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Profile summary */}
      {hasProfile && (
        <Card className="border-stone-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Your profile</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-stone-400 hover:text-stone-700"
              asChild
            >
              <Link href="/onboarding/seeker">Edit</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-stone-900">
                {seekerProfile.display_name}
              </p>
              <p className="text-sm capitalize text-stone-500">
                {seekerProfile.experience_level?.replace(/_/g, ' ')} level
              </p>
            </div>
            {seekerProfile.preferred_modalities?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {seekerProfile.preferred_modalities.map((m: string) => (
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
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Active requests */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-stone-900">
            Active requests
          </h2>
          {activeRequests.length > 0 && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-xs text-amber-700"
            >
              {activeRequests.length} active
            </Badge>
          )}
        </div>

        {activeRequests.length === 0 ? (
          <Card className="border-dashed border-stone-200">
            <CardContent className="py-10 text-center">
              <MessageSquare className="mx-auto mb-3 size-8 text-stone-300" />
              <p className="text-stone-500">No active requests.</p>
              <p className="mt-1 text-sm text-stone-400">
                Browse guides and send your first conversation request.
              </p>
              <Button
                className="mt-5 bg-emerald-700 hover:bg-emerald-800"
                size="sm"
                asChild
              >
                <Link href="/facilitators">Browse guides</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                fp={facilitatorMap[req.facilitator_id]}
                canReview={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Past requests
          </h2>
          <div className="space-y-3">
            {pastRequests.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                fp={facilitatorMap[req.facilitator_id]}
                canReview={req.status === 'completed' && !reviewedSet.has(req.id)}
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Safety resources */}
      <div>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-stone-900">
          <HeartHandshake className="size-5 text-emerald-600" />
          Safety resources
        </h2>
        <p className="mb-4 text-sm text-stone-500">
          If you need immediate support, please reach out to one of these
          organizations.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SAFETY_RESOURCES.map((r) => (
            <a
              key={r.name}
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 rounded-xl border border-stone-200 p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
            >
              <div>
                <p className="text-sm font-medium text-stone-800 group-hover:text-emerald-800">
                  {r.name}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{r.description}</p>
              </div>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-stone-300 group-hover:text-emerald-500" />
            </a>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <p className="mb-2 text-xs font-medium text-stone-600">Safety Library</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { href: '/resources/preparation-basics', label: 'Preparation basics' },
              { href: '/resources/integration-basics', label: 'Integration basics' },
              { href: '/resources/questions-to-ask', label: 'Questions to ask a guide' },
              { href: '/resources/red-flags', label: 'Red flags' },
              { href: '/resources/contraindications', label: 'Contraindications' },
              { href: '/resources/scope-of-practice', label: 'Coaching vs. therapy' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-emerald-700 hover:underline"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
