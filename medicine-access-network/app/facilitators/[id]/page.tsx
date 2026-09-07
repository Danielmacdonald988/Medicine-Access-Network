import headerStyles from './profile-header.module.css'
import { getTranslation } from '@/lib/i18n/server'
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

async function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  const { t } = await getTranslation()
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={t('{rating} out of {max} stars', { rating, max })}
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
  const { t, locale } = await getTranslation()
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
      ? t('Suggested donation from ${amount} USD', { amount: facilitator.minimum_donation })
      : t('Donation-based / sliding scale')
    : typeof facilitator.hourly_rate === 'number'
      ? t('${amount} USD per session', { amount: facilitator.hourly_rate })
      : t('Rate discussed on request')

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
      >{t("← Back to all guides")}</Link>
      <div className={headerStyles.header}>
        <div className={headerStyles.photo}>
          <Avatar className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eef0e8] p-1.5 after:rounded-[inherit] sm:h-40 sm:w-28 lg:h-48 lg:w-36">
            {primaryPhotoUrl && (
              <AvatarImage
                src={primaryPhotoUrl}
                alt={facilitator.display_name}
                className="rounded-none object-contain"
              />
            )}
            <AvatarFallback className="rounded-none bg-emerald-100 text-3xl font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className={headerStyles.identity}>
          <h1 id="profile-name" className="break-words text-3xl font-medium leading-tight tracking-[-0.04em] text-stone-900 sm:text-4xl">
                {facilitator.display_name}
              </h1>
              <a
                href="#profile-review"
                className="inline-flex min-h-9 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
              >
                <ShieldCheck aria-hidden="true" className="size-3" />{t("Profile reviewed")}</a>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
                {facilitator.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {facilitator.location}
                  </span>
                )}
                {facilitator.remote_available && (
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Video className="size-3.5" />{t("Remote available")}</span>
                )}
                {typeof facilitator.years_experience === 'number' &&
                  facilitator.years_experience > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {t('{years} years of practice (self-reported)', { years: facilitator.years_experience })}</span>
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
                    {t(reviews.length === 1 ? '{count} recent review' : '{count} recent reviews', { count: reviews.length })}
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone-500">{t("No reviews yet")}</p>
              )}
        </div>
        <aside className={headerStyles.contact} aria-label={t('Contact {name}', { name: facilitator.display_name })}>
          {hasDirectContact && <DirectContactLinks profile={facilitator} compact />}
              <Button
                asChild
                variant={hasDirectContact ? 'outline' : 'default'}
                className={`mt-4 h-auto min-h-11 w-full whitespace-normal ${hasDirectContact ? 'border-emerald-700 text-emerald-800 hover:bg-emerald-50' : 'bg-emerald-700 hover:bg-emerald-800'}`}
              >
                <a href="#contact">
                  {isOwnProfile
                    ? t('View your profile options')
                    : hasDirectContact ? t('Send a website inquiry')
                    : t('Contact {name}', { name: facilitator.display_name })}
                </a>
              </Button>
              <p className="mt-2 text-center text-xs text-stone-600">{t("No account needed. No payment to reach out.")}</p>
              <div className="mt-3 flex justify-center">
                <SaveGuideButton
                  profileId={facilitator.id}
                  displayName={facilitator.display_name}
                />
              </div>
        </aside>
        <section id="about" aria-labelledby="profile-name" className={headerStyles.bio}>
          <p dir="auto" className="mt-4 max-w-prose whitespace-pre-line break-words leading-7 text-stone-600">
                {facilitator.bio}
              </p>
              {locale !== 'en' && <p className="mt-3 text-xs text-stone-500">{t('Profile descriptions and reviews are shown in their original language.')}</p>}
        </section>
        <div className={headerStyles.fee}>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{t("Listed fee · USD")}</p>
              <p className="mt-1 font-semibold text-stone-900">{rateDisplay}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{t("Confirm session length and total cost directly.")}</p>
</div>
      </div>

      <nav
        aria-label={t("Profile sections")}
        className="my-8 flex flex-wrap gap-x-6 gap-y-1 border-b border-stone-200 pb-3"
      >
        {[
          { href: '#about', label: 'About' },
          { href: '#approach', label: 'Approach' },
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
            {t(label)}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 space-y-10 lg:col-span-2 lg:space-y-12">
          {/* Modalities */}
          <section
            id="approach"
            aria-labelledby="approach-heading"
            className="scroll-mt-24"
          >
            <h2
              id="approach-heading"
              className="mb-3 text-2xl font-medium tracking-tight text-stone-900"
            >{t("Areas of practice")}</h2>
            <div className="flex flex-wrap gap-2">
              {facilitator.modalities.map((m: string) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-normal text-stone-700 hover:bg-stone-100"
                >
                  {t(m)}
                </Badge>
              ))}
            </div>
          </section>

          {photoUrls.length > 0 && (
            <section id="photos" aria-labelledby="photos-heading" className="scroll-mt-24">
              <h2 id="photos-heading" className="text-2xl font-medium tracking-tight text-stone-900">{t("Photos")}</h2>
              <p className="mt-2 text-sm text-stone-600">{t('Provided by {name}. Select a photo to view it in a new tab.', { name: facilitator.display_name })}</p>
              <div className={`mt-4 grid gap-3 ${photoUrls.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                {photoUrls.map((url: string, index: number) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                    <Image
                      src={url}
                      alt={t(index === 0 ? '{name} — profile photo' : '{name} — additional photo {number}', { name: facilitator.display_name, number: index })}
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
            >{t("What “profile reviewed” means")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-900">{t("The platform team has approved this profile for the directory. Approval does not verify a clinical license or guarantee safety, suitability, or an outcome. Training and practice details below are provided by the guide.")}</p>
            <Link
              href="/resources/questions-to-ask"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-emerald-800 underline underline-offset-4"
            >{t("Questions to ask before choosing a guide")}</Link>
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
              />{t("Training & lineage")}</h2>
            {facilitator.lineage_or_training || certifications.length > 0 ? (
              <div>
                <p className="mb-3 text-xs text-stone-500">{t("Reported by the guide. Ask about the issuer, scope, and current status of any credential relevant to your needs.")}</p>
                {facilitator.lineage_or_training && (
                  <p dir="auto" className="whitespace-pre-line leading-relaxed text-stone-600">
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
              <p className="text-sm leading-relaxed text-stone-600">{t("Training details have not been provided. Ask about relevant training, supervision, and the scope of their work before deciding.")}</p>
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
              <ShieldCheck className="size-5 text-amber-500" />{t("Safety practices & screening")}</h2>
            {facilitator.safety_practices ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="mb-2 text-xs font-medium text-amber-800">{t("Described by the guide")}</p>
                <p dir="auto" className="whitespace-pre-line text-sm leading-relaxed text-amber-900">
                  {facilitator.safety_practices}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-stone-600">{t("This profile does not describe screening or safety practices. Ask how consent, boundaries, screening, and referrals are handled.")}</p>
            )}

            {/* Contraindication awareness */}
            {facilitator.contraindications_acknowledged && (
              <div>
                <h3 className="mb-3 font-semibold text-stone-900">{t("Screening commitment")}</h3>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    <div className="text-sm leading-relaxed text-emerald-900">
                      <p className="font-medium">
                        {t('{name} has acknowledged a screening commitment', { name: facilitator.display_name })}</p>
                      <p className="mt-2 text-emerald-800">{t("During their application, this guide committed to appropriate screening and declining work where contraindications are present. This is a statement from the guide, not an independent assessment of their screening or clinical qualifications.")}</p>
                      <p className="mt-2 text-emerald-800">{t("Ask how screening works, what falls outside their scope, and how referrals are handled. Discuss medical questions with a licensed healthcare provider.")}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm leading-relaxed text-stone-600">{t("Discuss health questions with a licensed healthcare provider.")}{' '}
              <Link
                href="/resources/contraindications"
                className="font-medium text-emerald-800 underline underline-offset-4"
              >{t("Health Questions & Screening")}</Link>
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
            >{t("Fees & practical details")}</h2>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5">
              <p className="font-medium text-stone-900">{rateDisplay}</p>
              <p className="mt-2 text-sm text-stone-600">{t("Confirm session length, total cost, cancellation terms, and any sliding scale options before agreeing to a session.")}</p>
              <p className="mt-1.5 text-xs text-stone-500">{t("All payments are for legal support services only — preparation coaching, integration guidance, breathwork, and consultation. No payment is required to send a conversation request.")}</p>
              <p className="mt-3 text-sm text-stone-600">
                {t(facilitator.remote_available
                  ? 'Online support is listed. Confirm formats, time zones, and whether the guide can work with you where you live.'
                  : 'Online sessions are not listed. Ask which formats and locations are possible.') }{' '}{t("A listed location does not confirm in-person availability.")}</p>
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
                  >{t("Recent reviews")}</h2>
                  {avgRating !== null && (
                    <div className="flex items-center gap-2">
                      <StarRow rating={Math.round(avgRating)} />
                      <span className="text-sm font-medium text-stone-700">
                        {avgRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-stone-500">
                        ({t(reviews.length === 1 ? '{count} review' : '{count} reviews', { count: reviews.length })})
                      </span>
                    </div>
                  )}
                </div>
                <p className="mb-5 text-xs leading-relaxed text-stone-500">{t('Ratings summarize up to 20 recent reviews shown below. Reviews reflect individual experiences and do not establish safety or predict results.')}</p>

                {/* Sub-ratings summary */}
                {avgSafetyRating !== null && avgIntegrationRating !== null && (
                  <div className="mb-5 flex flex-wrap gap-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm">
                    <div>
                      <p className="text-xs text-stone-500">{t("Safety")}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <StarRow rating={Math.round(avgSafetyRating)} />
                        <span className="font-medium text-stone-700">
                          {avgSafetyRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">{t("Integration")}</p>
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
                      ).toLocaleDateString(locale, {
                        month: 'long',
                        year: 'numeric',
                      })
                      return (
                        <Card key={review.id} className="border-stone-200">
                          <CardContent className="p-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <StarRow rating={review.rating} />
                                <span className="text-xs text-stone-500">{t('Safety {safety}/5 · Integration {integration}/5', { safety: review.safety_rating, integration: review.integration_rating })}
                                </span>
                              </div>
                              <span className="shrink-0 text-xs text-stone-500">
                                {date}
                              </span>
                            </div>
                            <p dir="auto" className="text-sm leading-relaxed text-stone-600">
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
                >{t("Reviews")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{t("No reviews have been published yet. Take time to ask questions and check relevant training before deciding whether to work together.")}</p>
              </div>
            )}
          </section>
        </div>

        {/* The form stays in normal flow so it remains reachable at high zoom. */}
        <aside
          aria-label={t("Contact and support")}
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
                    ? t('This is your public profile')
                    : t('Contact {name}', { name: facilitator.display_name })}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {isOwnProfile
                    ? t('Visitors can use your listed contact options or send you a website inquiry.')
                    : t('Introduce yourself and ask whether this guide’s support could be right for you.')}
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
                        {t('{years} years, self-reported; may include personal practice.', { years: facilitator.years_experience })}</p>
                    )}
                </div>

                {isOwnProfile ? (
                  <Button
                    asChild
                    className="min-h-11 w-full bg-emerald-700 hover:bg-emerald-800"
                  >
                    <Link href="/facilitator">{t("Open your dashboard")}</Link>
                  </Button>
                ) : (
                  <>
                    {hasDirectContact && <h3 className="mb-3 font-semibold text-stone-900">{t("Or send a website inquiry")}</h3>}
                    <div className="mb-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">
                      <h3 className="font-medium">{t("What happens next")}</h3>
                      <ol className="mt-2 list-decimal space-y-2 pl-4 leading-relaxed">
                        <li>{t("Your request is shared privately with this guide.")}</li>
                        <li>{t("They can reply to your email to discuss fit, fees, and availability.")}</li>
                        <li>{t("You decide together whether to arrange a session. Sending a request does not book one.")}</li>
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
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-700">{t("Important to know")}</p>
                <ul className="space-y-3">
                  {LEGAL_NOTES.map(({ icon: Icon, text }) => (
                    <li
                      key={text}
                      className="flex items-start gap-2.5 text-xs leading-relaxed text-amber-900"
                    >
                      <Icon className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      {t(text)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-amber-200 pt-4 space-y-1">
                  <p className="text-xs font-medium text-amber-800">{t("Safety Library")}</p>
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
                      {t(label)}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Link
              href={`/contact?profile=${encodeURIComponent(facilitator.id)}`}
              className="inline-flex min-h-11 items-center text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900"
            >{t("Report this profile")}</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
