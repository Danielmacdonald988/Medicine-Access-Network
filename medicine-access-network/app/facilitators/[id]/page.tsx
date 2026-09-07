import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
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
import { Button } from '@/components/ui/button'
import { SaveGuideButton } from '@/components/saved/SaveGuideButton'
import { ContactRequestForm } from '@/components/forms/ContactRequestForm'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { getProfileImageUrl } from '@/lib/profile-media'
import { getDirectContactLinks } from '@/lib/direct-contact'
import { DirectContactLinks } from '@/components/profile/DirectContactLinks'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  // facilitator_public_profiles already filters to approved + public — no
  // separate status check needed (and verification_status isn't a column
  // on this view at all).
  const { data } = await supabase
    .from('facilitator_public_profiles')
    .select('display_name, bio, location, modalities, image_paths')
    .eq('id', id)
    .maybeSingle()

  // A pending/rejected/hidden/nonexistent id all land here identically
  // (see the view's own filter) — explicitly noindex it. Otherwise a stale
  // or guessed link could get crawled and indexed as a thin/empty page.
  if (!data) {
    return {
      title: 'Guide not found',
      robots: { index: false, follow: false },
    }
  }

  const description = data.location
    ? `${data.bio.slice(0, 140)} — ${data.location}`.slice(0, 160)
    : data.bio.slice(0, 160)
  const photoUrl = getProfileImageUrl(data.image_paths?.[0])

  return {
    title: data.display_name,
    description,
    alternates: { canonical: `/facilitators/${id}` },
    openGraph: {
      title: data.display_name,
      description,
      url: `/facilitators/${id}`,
      type: 'profile',
      images: photoUrl ? [{ url: photoUrl }] : undefined,
    },
    twitter: {
      card: 'summary',
      title: data.display_name,
      description,
      images: photoUrl ? [photoUrl] : undefined,
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
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

  const { data: facilitator } = await supabase
    .from('facilitator_public_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!facilitator) notFound()

  // This only changes the owner preview. Browsing and contacting other guides
  // never require an explorer account, and an auth outage leaves the page usable.
  const authUser = await supabase.auth
    .getUser()
    .then(({ data }) => data.user)
    .catch(() => null)
  const isOwnProfile = authUser?.id === facilitator.user_id

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
      ? reviews.reduce(
          (sum: number, r: { rating: number }) => sum + r.rating,
          0,
        ) / reviews.length
      : null

  const avgSafetyRating =
    reviews && reviews.length > 0
      ? reviews.reduce(
          (sum: number, r: { safety_rating: number }) => sum + r.safety_rating,
          0,
        ) / reviews.length
      : null

  const avgIntegrationRating =
    reviews && reviews.length > 0
      ? reviews.reduce(
          (sum: number, r: { integration_rating: number }) =>
            sum + r.integration_rating,
          0,
        ) / reviews.length
      : null

  const rateDisplay = facilitator.donation_based
    ? typeof facilitator.minimum_donation === 'number'
      ? `Donation-based — suggested from $${facilitator.minimum_donation}`
      : 'Donation-based / sliding scale'
    : typeof facilitator.hourly_rate === 'number'
      ? `$${facilitator.hourly_rate} per session`
      : 'Rate discussed on request'

  const certifications: string[] = facilitator.certifications ?? []
  const photoUrls = (facilitator.image_paths ?? [])
    .slice(0, 5)
    .map((path: string) => getProfileImageUrl(path))
    .filter((url: string | null): url is string => url !== null)
  const primaryPhotoUrl = photoUrls[0]
  const hasDirectContact = getDirectContactLinks(facilitator).length > 0

  return (
    <div className="network-shell py-8 sm:py-12">
      <Link
        href="/facilitators"
        className="mb-6 inline-flex min-h-11 items-center text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
      >
        ← Back to all guides
      </Link>
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-8 lg:p-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-7">
            <Avatar className="h-44 w-40 shrink-0 overflow-hidden rounded-[70px_70px_12px_12px] after:rounded-[inherit] sm:h-56 sm:w-44">
              {primaryPhotoUrl && (
                <AvatarImage
                  src={primaryPhotoUrl}
                  alt={facilitator.display_name}
                  className="rounded-none object-cover"
                />
              )}
              <AvatarFallback className="rounded-none bg-emerald-100 text-3xl font-medium text-emerald-800">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-col items-start gap-3">
                <h1 className="break-words text-4xl font-medium leading-tight tracking-[-0.04em] text-stone-900 sm:text-5xl">
                  {facilitator.display_name}
                </h1>
                <a
                  href="#profile-review"
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
                >
                  <ShieldCheck aria-hidden="true" className="size-3" />
                  Profile reviewed
                </a>
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
                      <Clock aria-hidden="true" className="size-3.5" />
                      {facilitator.years_experience} yr
                      {facilitator.years_experience === 1 ? '' : 's'} practice
                      (self-reported)
                    </span>
                  )}
              </div>

              {avgRating !== null && reviews ? (
                <div className="mt-2 flex items-center gap-2">
                  <StarRow rating={Math.round(avgRating)} />
                  <span className="text-sm font-medium text-stone-700">
                    {avgRating.toFixed(1)}
                  </span>
                  <a
                    href="#reviews"
                    className="text-sm text-stone-600 underline underline-offset-4"
                  >
                    {reviews.length} recent{' '}
                    {reviews.length === 1 ? 'review' : 'reviews'}
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-500">No reviews yet</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#f0f1e9] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Listed fee · USD
            </p>
            <p className="mt-1 font-semibold text-stone-900">{rateDisplay}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-600">
              Confirm session length and total cost directly.
            </p>
            {hasDirectContact && <div className="mt-4"><DirectContactLinks profile={facilitator} /></div>}
            <Button
              asChild
              variant={hasDirectContact ? 'outline' : 'default'}
              className={`mt-4 h-auto min-h-11 w-full whitespace-normal ${hasDirectContact ? 'border-emerald-700 text-emerald-800 hover:bg-emerald-50' : 'bg-emerald-700 hover:bg-emerald-800'}`}
            >
              <a href="#contact">
                {isOwnProfile
                  ? 'View your profile options'
                  : hasDirectContact ? 'Send a website inquiry'
                  : `Contact ${facilitator.display_name}`}
              </a>
            </Button>
            <p className="mt-2 text-center text-xs text-stone-600">
              No account needed. No payment to reach out.
            </p>
            <div className="mt-3 flex justify-center">
              <SaveGuideButton
                profileId={facilitator.id}
                displayName={facilitator.display_name}
              />
            </div>
          </div>
        </div>
      </div>

      <nav
        aria-label="Profile sections"
        className="my-8 flex flex-wrap gap-x-6 gap-y-1 border-b border-stone-200 pb-3"
      >
        {[
          { href: '#about', label: 'About & approach' },
          ...(photoUrls.length ? [{ href: '#photos', label: 'Photos' }] : []),
          { href: '#training', label: 'Training' },
          { href: '#safety', label: 'Safety' },
          { href: '#fees', label: 'Fees' },
          { href: '#reviews', label: 'Reviews' },
          {
            href: '#contact',
            label: isOwnProfile ? 'Your profile' : 'Contact',
          },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center text-sm font-medium text-stone-700 underline-offset-4 hover:text-emerald-800 hover:underline"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-10 lg:col-span-2 lg:space-y-12">
          {/* Modalities */}
          <section
            id="about"
            aria-labelledby="about-heading"
            className="scroll-mt-24"
          >
            <h2
              id="about-heading"
              className="mb-3 text-2xl font-medium tracking-tight text-stone-900"
            >
              About &amp; approach
            </h2>
            <p className="mb-3 text-sm font-medium text-stone-600">
              Listed areas of practice
            </p>
            <div className="flex flex-wrap gap-2">
              {facilitator.modalities.map((m: string) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-normal text-stone-700 hover:bg-stone-100"
                >
                  {m}
                </Badge>
              ))}
            </div>
            <p className="mt-5 whitespace-pre-line leading-relaxed text-stone-600">
              {facilitator.bio}
            </p>
          </section>

          {photoUrls.length > 0 && (
            <section id="photos" aria-labelledby="photos-heading" className="scroll-mt-24">
              <h2 id="photos-heading" className="text-2xl font-medium tracking-tight text-stone-900">Photos</h2>
              <p className="mt-2 text-sm text-stone-600">Provided by {facilitator.display_name}. Select a photo to view it in a new tab.</p>
              <div className={`mt-4 grid gap-3 ${photoUrls.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {photoUrls.map((url: string, index: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                    <Image
                      src={url}
                      alt={`${facilitator.display_name} — ${index === 0 ? 'profile photo' : `additional photo ${index}`}`}
                      width={960}
                      height={720}
                      unoptimized
                      className="aspect-[4/3] max-h-96 w-full object-contain"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          <section
            id="profile-review"
            aria-labelledby="profile-review-heading"
            className="scroll-mt-24 rounded-2xl border border-stone-200 bg-[#e9eee5] p-6"
          >
            <h2
              id="profile-review-heading"
              className="font-semibold text-emerald-900"
            >
              What “profile reviewed” means
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">
              The platform team has approved this profile for the directory.
              Approval does not verify a clinical license or guarantee safety,
              suitability, or an outcome. Training and practice details below
              are provided by the guide.
            </p>
            <Link
              href="/resources/questions-to-ask"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-emerald-800 underline underline-offset-4"
            >
              Questions to ask before choosing a guide
            </Link>
          </section>

          {/* Training, lineage & certifications */}
          <section
            id="training"
            aria-labelledby="training-heading"
            className="scroll-mt-24"
          >
            <h2
              id="training-heading"
              className="mb-3 flex items-center gap-2 text-2xl font-medium tracking-tight text-stone-900"
            >
              <GraduationCap
                aria-hidden="true"
                className="size-5 text-stone-500"
              />
              Training &amp; lineage
            </h2>
            {facilitator.lineage_or_training || certifications.length > 0 ? (
              <div>
                <p className="mb-3 text-xs text-stone-500">
                  Reported by the guide. Ask about the issuer, scope, and
                  current status of any credential relevant to your needs.
                </p>
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
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-stone-600">
                Training details have not been provided. Ask about relevant
                training, supervision, and the scope of their work before
                deciding.
              </p>
            )}
          </section>

          <section
            id="safety"
            aria-labelledby="safety-heading"
            className="scroll-mt-24 space-y-5"
          >
            <h2
              id="safety-heading"
              className="mb-3 flex items-center gap-2 text-2xl font-medium tracking-tight text-stone-900"
            >
              <ShieldCheck className="size-5 text-amber-500" />
              Safety practices &amp; screening
            </h2>
            {facilitator.safety_practices ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="mb-2 text-xs font-medium text-amber-800">
                  Described by the guide
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-amber-900">
                  {facilitator.safety_practices}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-stone-600">
                This profile does not describe screening or safety practices.
                Ask how consent, boundaries, screening, and referrals are
                handled.
              </p>
            )}

            {/* Contraindication awareness */}
            {facilitator.contraindications_acknowledged && (
              <div>
                <h3 className="mb-3 font-semibold text-stone-900">
                  Screening commitment
                </h3>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div className="text-sm leading-relaxed text-emerald-900">
                      <p className="font-medium">
                        {facilitator.display_name} has acknowledged a screening
                        commitment
                      </p>
                      <p className="mt-2 text-emerald-800">
                        During their application, this guide committed to
                        appropriate screening and declining work where
                        contraindications are present. This is a statement from
                        the guide, not an independent assessment of their
                        screening or clinical qualifications.
                      </p>
                      <p className="mt-2 text-emerald-800">
                        Ask how screening works, what falls outside their scope,
                        and how referrals are handled. Discuss medical questions
                        with a licensed healthcare provider.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm leading-relaxed text-stone-600">
              Discuss health questions with a licensed healthcare provider.{' '}
              <Link
                href="/resources/contraindications"
                className="font-medium text-emerald-800 underline underline-offset-4"
              >
                Health Questions &amp; Screening
              </Link>
            </p>
          </section>

          {/* Compensation */}
          <section
            id="fees"
            aria-labelledby="fees-heading"
            className="scroll-mt-24"
          >
            <h2
              id="fees-heading"
              className="mb-3 text-2xl font-medium tracking-tight text-stone-900"
            >
              Fees &amp; practical details
            </h2>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <p className="font-medium text-stone-900">{rateDisplay}</p>
              <p className="mt-2 text-sm text-stone-600">
                Confirm session length, total cost, cancellation terms, and any
                sliding scale options before agreeing to a session.
              </p>
              <p className="mt-1.5 text-xs text-stone-500">
                All payments are for legal support services only — preparation
                coaching, integration guidance, breathwork, and consultation. No
                payment is required to send a conversation request.
              </p>
              <p className="mt-3 text-sm text-stone-600">
                {facilitator.remote_available
                  ? 'Online support is listed. Confirm formats, time zones, and whether the guide can work with you where you live.'
                  : 'Online sessions are not listed. Ask which formats and locations are possible.'}{' '}
                A listed location does not confirm in-person availability.
              </p>
            </div>
          </section>

          <section
            id="reviews"
            aria-labelledby="reviews-heading"
            className="scroll-mt-24"
          >
            {reviews && reviews.length > 0 ? (
              <div>
                <div className="mb-5 flex flex-wrap items-center gap-4">
                  <h2
                    id="reviews-heading"
                    className="text-2xl font-medium tracking-tight text-stone-900"
                  >
                    Recent reviews
                  </h2>
                  {avgRating !== null && (
                    <div className="flex items-center gap-2">
                      <StarRow rating={Math.round(avgRating)} />
                      <span className="text-sm font-medium text-stone-700">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-stone-500">
                        ({reviews.length}{' '}
                        {reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
                <p className="mb-5 text-xs leading-relaxed text-stone-500">
                  Ratings summarize the{' '}
                  {reviews.length === 20 ? '20 most recent' : reviews.length}{' '}
                  reviews shown below. Reviews reflect individual experiences
                  and do not establish safety or predict results.
                </p>

                {/* Sub-ratings summary */}
                {avgSafetyRating !== null && avgIntegrationRating !== null && (
                  <div className="mb-5 flex flex-wrap gap-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
                    <div>
                      <p className="text-xs text-stone-500">Safety</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StarRow rating={Math.round(avgSafetyRating)} />
                        <span className="font-medium text-stone-700">
                          {avgSafetyRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Integration</p>
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
                      const date = new Date(
                        review.created_at,
                      ).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                      return (
                        <Card key={review.id} className="border-stone-200">
                          <CardContent className="p-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <StarRow rating={review.rating} />
                                <span className="text-xs text-stone-500">
                                  Safety {review.safety_rating}/5 &middot;{' '}
                                  Integration {review.integration_rating}/5
                                </span>
                              </div>
                              <span className="shrink-0 text-xs text-stone-500">
                                {date}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-stone-600">
                              {review.text}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    },
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2
                  id="reviews-heading"
                  className="break-words text-2xl font-medium tracking-tight text-stone-900"
                >
                  Reviews
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  No reviews have been published yet. Take time to ask questions
                  and check relevant training before deciding whether to work
                  together.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* The form stays in normal flow so it remains reachable at high zoom. */}
        <aside
          aria-label="Contact and support"
          className="min-w-0 lg:col-span-1"
        >
          <div className="space-y-4">
            {/* Request conversation card */}
            <Card
              id="contact"
              tabIndex={-1}
              className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white py-1 shadow-none ring-0 focus-visible:outline-2 focus-visible:outline-emerald-700"
            >
              <CardContent className="p-5">
                <h2
                  tabIndex={-1}
                  className="break-words text-2xl font-medium tracking-tight text-stone-900"
                >
                  {isOwnProfile
                    ? 'This is your public profile'
                    : `Contact ${facilitator.display_name}`}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {isOwnProfile
                    ? 'Visitors can use your listed contact options or send you a website inquiry.'
                    : 'Introduce yourself and ask whether this guide’s support could be right for you.'}
                </p>

                {hasDirectContact && <div className="mt-5"><DirectContactLinks profile={facilitator} /></div>}

                <Separator className="my-4" />

                <div className="mb-4">
                  <p className="text-sm font-medium text-stone-900">
                    {rateDisplay}
                  </p>
                  {typeof facilitator.years_experience === 'number' &&
                    facilitator.years_experience > 0 && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        {facilitator.years_experience} year
                        {facilitator.years_experience === 1 ? '' : 's'} of
                        practice, self-reported; may include personal practice
                      </p>
                    )}
                </div>

                {isOwnProfile ? (
                  <Button
                    asChild
                    className="min-h-11 w-full bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Link href="/facilitator">Open your dashboard</Link>
                  </Button>
                ) : (
                  <>
                    {hasDirectContact && <h3 className="mb-3 font-semibold text-stone-900">Or send a website inquiry</h3>}
                    <div className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                      <h3 className="font-medium">What happens next</h3>
                      <ol className="mt-2 list-decimal space-y-2 pl-4 leading-relaxed">
                        <li>
                          Your request is shared privately with this guide.
                        </li>
                        <li>
                          They can reply to your email to discuss fit, fees, and
                          availability.
                        </li>
                        <li>
                          You decide together whether to arrange a session.
                          Sending a request does not book one.
                        </li>
                      </ol>
                    </div>
                    <ContactRequestForm
                      key={facilitator.id}
                      facilitatorProfileId={facilitator.id}
                      facilitatorDisplayName={facilitator.display_name}
                      modalities={facilitator.modalities ?? []}
                      remoteAvailable={facilitator.remote_available === true}
                      location={facilitator.location}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Legal / safety sidebar */}
            <Card className="rounded-2xl border border-[#e2d4c7] bg-[#f3e6dc]/70 py-1 ring-0">
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
                  <p className="text-xs font-medium text-amber-800">
                    Safety Library
                  </p>
                  {[
                    {
                      href: '/resources/questions-to-ask',
                      label: 'Questions to ask a guide',
                    },
                    {
                      href: '/resources/red-flags',
                      label: 'Red flags to watch for',
                    },
                    {
                      href: '/resources/contraindications',
                      label: 'Health Questions & Screening',
                    },
                    { href: '/resources/emergency', label: 'Get Urgent Help' },
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

            <Link
              href={`/contact?profile=${encodeURIComponent(facilitator.id)}`}
              className="inline-flex min-h-11 items-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900"
            >
              Report this profile
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
