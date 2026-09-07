'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'

import Link from 'next/link'
import { ArrowUpRight, MapPin, Video, Star, ShieldCheck, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FacilitatorSearchResult } from '@/lib/types'
import { SaveGuideButton } from '@/components/saved/SaveGuideButton'
import { getProfileImageUrl } from '@/lib/profile-media'

interface FacilitatorCardProps {
  facilitator: FacilitatorSearchResult
}

export function FacilitatorCard({ facilitator: f }: FacilitatorCardProps) {
  const { t, locale } = useTranslation()
  const photoUrl = getProfileImageUrl(f.image_paths?.[0])
  const initials = f.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const rateDisplay = f.donation_based
    ? typeof f.minimum_donation === 'number'
      ? t('Suggested donation from ${amount} USD', { amount: f.minimum_donation })
      : t('Donation-based')
    : typeof f.hourly_rate === 'number'
      ? t('${amount} USD per session', { amount: f.hourly_rate })
      : t('Rate on request')

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(32,62,52,0.3)]">
      <div className="p-4 pb-0">
        <Link href={`/facilitators/${f.id}`} tabIndex={-1} aria-hidden="true" className="block">
          <Avatar className="h-60 w-full overflow-hidden rounded-xl bg-[#eef0e8] p-2 after:rounded-[inherit] sm:h-64">
            {photoUrl && <AvatarImage src={photoUrl} alt={f.display_name} className="rounded-none object-contain" />}
            <AvatarFallback className="rounded-none bg-emerald-100 text-4xl font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <Link
            href={`/facilitators/${f.id}#profile-review`}
            aria-label={t('What profile review means for {name}', { name: f.display_name })}
            className="inline-flex min-h-8 items-center gap-1.5 text-xs font-medium text-emerald-700 underline-offset-4 hover:underline"
          >
            <ShieldCheck aria-hidden="true" className="size-3.5" />{t("Profile reviewed")}</Link>
          <h3 className="mt-1 break-words text-2xl font-medium tracking-tight text-stone-900">
            <Link href={`/facilitators/${f.id}`} className="underline-offset-4 hover:text-emerald-800 hover:underline">{f.display_name}</Link>
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-relaxed text-stone-600">
            {f.location && <span className="flex max-w-full items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 shrink-0" /><span className="min-w-0 break-words">{f.location}</span></span>}
            {f.remote_available && <span className="flex items-center gap-1.5 text-emerald-700"><Video aria-hidden="true" className="size-3.5 shrink-0" />{t("Online sessions")}</span>}
            {typeof f.years_experience === 'number' && f.years_experience > 0 && (
              <span className="flex items-center gap-1.5"><Clock aria-hidden="true" className="size-3.5 shrink-0" />{t('{years} years of practice (self-reported)', { years: f.years_experience })}</span>
            )}
          </div>
        </div>

        <div>
          <p dir="auto" className="line-clamp-3 text-sm leading-7 text-stone-600">{f.bio}</p>
          {locale !== 'en' && <p className="mt-2 text-xs text-stone-500">{t('Profile text is shown in its original language.')}</p>}
        </div>

        {f.modalities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.modalities.slice(0, 3).map((modality) => (
              <Badge key={modality} variant="secondary" className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-normal text-stone-700 hover:bg-stone-100">{t(modality)}</Badge>
            ))}
            {f.modalities.length > 3 && <Badge variant="secondary" className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-normal text-stone-600 hover:bg-stone-100">{t('+{count} more', { count: f.modalities.length - 3 })}</Badge>}
          </div>
        )}

        {typeof f.avg_rating === 'number' && Number.isFinite(f.avg_rating) && (f.review_count ?? 0) > 0 ? (
          <div className="mt-auto flex items-center gap-1.5 text-xs">
            <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-stone-700">{f.avg_rating.toFixed(1)}<span className="sr-only">{' '}{t("out of 5")}</span></span>
            <span className="text-stone-500">({t(f.review_count === 1 ? '{count} review' : '{count} reviews', { count: f.review_count ?? 0 })})</span>
          </div>
        ) : <p className="mt-auto text-xs text-stone-500">{t("No reviews yet")}</p>}
      </div>

      <div className="border-t border-stone-200 bg-stone-50/70 px-5 py-5 sm:px-6">
        <p className="text-sm font-semibold text-stone-900">{rateDisplay}</p>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">{t("Confirm fees and availability with the guide.")}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <SaveGuideButton profileId={f.id} displayName={f.display_name} compact />
          <Button size="sm" className="min-h-11 bg-emerald-700 px-4 text-sm text-white hover:bg-emerald-800" asChild>
            <Link href={`/facilitators/${f.id}`} aria-label={t('View {name}’s profile', { name: f.display_name })}>{t("View profile")}{' '}<ArrowUpRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
