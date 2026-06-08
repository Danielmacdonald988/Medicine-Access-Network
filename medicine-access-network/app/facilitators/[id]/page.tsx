import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Video,
  Star,
  ShieldCheck,
  Clock,
  GraduationCap,
  AlertTriangle,
  Ban,
  BookOpen,
  HeartPulse,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookingRequestForm } from '@/components/forms/BookingRequestForm'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('facilitator_profiles')
    .select('display_name, bio')
    .eq('id', id)
    .eq('verification_status', 'approved')
    .maybeSingle()

  if (!data) return { title: 'Guide not found' }
  return {
    title: data.display_name,
    description: data.bio.slice(0, 160),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`}
        />
      ))}
    </div>
  )
}

// ─── Legal sidebar content ────────────────────────────────────────────────────

const LEGAL_NOTES = [
  {
    icon: AlertTriangle,
    text: 'Guides on this platform are not emergency providers. In a mental health crisis call 988 (US) or your local emergency services.',
  },
  {
    icon: HeartPulse,
    text: 'Nothing on this platform is medical advice. Always consult a licensed healthcare provider for medical decisions.',
  },
  {
    icon: Ban,
    text: 'This platform does not sell, source, supply, or coordinate access to controlled substances of any kind.',
  },
  {
    icon: BookOpen,
    text: 'All services are for preparation, integration, and legal wellness support only.',
  },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FacilitatorProfilePage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()

  const [{ data: facilitator }, currentUser] = await Promise.all([
    supabase
      .from('facilitator_profiles')
      .select('*')
      .eq('id', id)
      .eq('verification_status', 'approved')
      .maybeSingle(),
    getCurrentUser(),
  ])

  if (!facilitator) notFound()

  // reviews.facilitator_id references users.id, not facilitator_profiles.id
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, safety_rating, integration_rating, text, created_at')
    .eq('facilitator_id', facilitator.user_id)
    .order('created_at', { ascending: false })
    .limit(20)

  const initials = facilitator.display_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
        reviews.length
      : null

  const avgSafetyRating =
    reviews && reviews.length > 0
      ? reviews.reduce(
          (sum: number, r: { safety_rating: number }) => sum + r.safety_rating,
          0
        ) / reviews.length
      : null

  const avgIntegrationRating =
    reviews && reviews.length > 0
      ? reviews.reduce(
          (sum: number, r: { integration_rating: number }) =>
            sum + r.integration_rating,
          0
        ) / reviews.length
      : null

  const rateDisplay = facilitator.donation_based
    ? facilitator.minimum_donation
      ? `Donation-based — suggested from $${facilitator.minimum_donation}`
      : 'Donation-based / sliding scale'
    : facilitator.hourly_rate
      ? `$${facilitator.hourly_rate} per session`
      : 'Rate discussed on request'

  const certifications: string[] = facilitator.certifications ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="space-y-10 lg:col-span-2">

          {/* Header */}
          <div className="flex items-start gap-5">
            <Avatar className="size-20 shrink-0 ring-2 ring-emerald-100 ring-offset-2">
              {facilitator.avatar_url && (
                <AvatarImage
                  src={facilitator.avatar_url}
                  alt={facilitator.display_name}
                />
              )}
              <AvatarFallback className="bg-emerald-100 text-xl font-semibold text-emerald-800">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-stone-900">
                  {facilitator.display_name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <ShieldCheck className="size-3" />
                  Verified guide
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
                {facilitator.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {facilitator.location}
                  </span>
                )}
                {facilitator.remote_available && (
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Video className="size-3.5" />
                    Remote available
                  </span>
                )}
                {typeof facilitator.years_experience === 'number' &&
                  facilitator.years_experience > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {facilitator.years_experience} yr
                      {facilitator.years_experience === 1 ? '' : 's'} experience
                    </span>
                  )}
              </div>

              {avgRating !== null && reviews && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRow rating={Math.round(avgRating)} />
                  <span className="text-sm font-medium text-stone-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-stone-400">
                    ({reviews.length}{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Modalities */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">
              Areas of practice
            </h2>
            <div className="flex flex-wrap gap-2">
              {facilitator.modalities.map((m: string) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="bg-stone-100 text-sm text-stone-700 hover:bg-stone-100"
                >
                  {m}
                </Badge>
              ))}
            </div>
          </section>

          {/* Bio */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">About</h2>
            <p className="whitespace-pre-line leading-relaxed text-stone-600">
              {facilitator.bio}
            </p>
          </section>

          {/* Training, lineage & certifications */}
          {(facilitator.lineage_or_training || certifications.length > 0) && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
                <GraduationCap className="size-5 text-stone-400" />
                Training &amp; lineage
              </h2>
              {facilitator.lineage_or_training && (
                <p className="whitespace-pre-line leading-relaxed text-stone-600">
                  {facilitator.lineage_or_training}
                </p>
              )}
              {certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {certifications.map((cert: string) => (
                    <Badge
                      key={cert}
                      variant="outline"
                      className="border-stone-300 text-xs text-stone-600"
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Safety practices */}
          {facilitator.safety_practices && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
                <ShieldCheck className="size-5 text-amber-500" />
                Safety practices &amp; screening
              </h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900">
                  {facilitator.safety_practices}
                </p>
              </div>
            </section>
          )}

          {/* Contraindication awareness */}
          {facilitator.contraindications_acknowledged && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-stone-900">
                Contraindication awareness
              </h2>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <div className="text-sm leading-relaxed text-emerald-900">
                    <p className="font-medium">
                      {facilitator.display_name} screens for contraindications
                    </p>
                    <p className="mt-2 text-emerald-800">
                      This guide has committed to conducting intake assessments and
                      declining to work with clients where contraindications are
                      present. Common contraindications include certain medications
                      (MAOIs, lithium, antipsychotics), cardiovascular conditions,
                      active psychosis or schizophrenia, severe PTSD, pregnancy, and
                      recent major surgery.
                    </p>
                    <p className="mt-2 text-emerald-800">
                      If you have any of these conditions or are uncertain, please
                      discuss them openly before proceeding. You should also consult
                      your healthcare provider.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Compensation */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">
              Compensation
            </h2>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <p className="font-medium text-stone-900">{rateDisplay}</p>
              <p className="mt-1.5 text-xs text-stone-500">
                All payments are for legal support services only — preparation
                coaching, integration guidance, breathwork, and consultation. No
                payment is required to send a conversation request.
              </p>
            </div>
          </section>

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <section>
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <h2 className="text-lg font-semibold text-stone-900">Reviews</h2>
                {avgRating !== null && (
                  <div className="flex items-center gap-2">
                    <StarRow rating={Math.round(avgRating)} />
                    <span className="text-sm font-medium text-stone-700">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-stone-400">
                      ({reviews.length}{' '}
                      {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-ratings summary */}
              {avgSafetyRating !== null && avgIntegrationRating !== null && (
                <div className="mb-5 flex gap-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
                  <div>
                    <p className="text-xs text-stone-400">Safety</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StarRow rating={Math.round(avgSafetyRating)} />
                      <span className="font-medium text-stone-700">
                        {avgSafetyRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Integration</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StarRow rating={Math.round(avgIntegrationRating)} />
                      <span className="font-medium text-stone-700">
                        {avgIntegrationRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {reviews.map(
                  (review: {
                    id: string
                    rating: number
                    safety_rating: number
                    integration_rating: number
                    text: string
                    created_at: string
                  }) => {
                    const date = new Date(review.created_at).toLocaleDateString(
                      'en-US',
                      { month: 'long', year: 'numeric' }
                    )
                    return (
                      <Card key={review.id} className="border-stone-200">
                        <CardContent className="p-5">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <StarRow rating={review.rating} />
                              <span className="text-xs text-stone-400">
                                Safety {review.safety_rating}/5 &middot;{' '}
                                Integration {review.integration_rating}/5
                              </span>
                            </div>
                            <span className="shrink-0 text-xs text-stone-400">
                              {date}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-stone-600">
                            {review.text}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  }
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Sticky sidebar ───────────────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">

            {/* Request conversation card */}
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-semibold text-stone-900">
                  Request a conversation
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  Reach out to {facilitator.display_name} to discuss whether
                  their support is the right fit for your needs.
                </p>

                <Separator className="my-4" />

                <div className="mb-4">
                  <p className="text-sm font-medium text-stone-900">
                    {rateDisplay}
                  </p>
                  {typeof facilitator.years_experience === 'number' &&
                    facilitator.years_experience > 0 && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        {facilitator.years_experience} year
                        {facilitator.years_experience === 1 ? '' : 's'} of
                        experience
                      </p>
                    )}
                </div>

                <BookingRequestForm
                  facilitatorId={facilitator.user_id}
                  isAuthenticated={!!currentUser}
                />
              </CardContent>
            </Card>

            {/* Legal / safety sidebar */}
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Important to know
                </p>
                <ul className="space-y-3">
                  {LEGAL_NOTES.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-amber-900"
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      {text}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-amber-200 pt-4 space-y-1">
                  <p className="text-xs font-medium text-amber-800">Safety Library</p>
                  {[
                    { href: '/resources/questions-to-ask', label: 'Questions to ask a guide' },
                    { href: '/resources/red-flags', label: 'Red flags to watch for' },
                    { href: '/resources/contraindications', label: 'Contraindications & safety' },
                    { href: '/resources/emergency', label: 'Emergency resources' },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="block text-xs text-amber-700 underline-offset-2 hover:underline"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
