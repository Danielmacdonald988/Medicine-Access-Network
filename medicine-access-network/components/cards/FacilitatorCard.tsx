import Link from 'next/link'
import { MapPin, Video, Star, ShieldCheck, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FacilitatorSearchResult } from '@/lib/types'

interface FacilitatorCardProps {
  facilitator: FacilitatorSearchResult
}

export function FacilitatorCard({ facilitator: f }: FacilitatorCardProps) {
  const initials = f.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const rateDisplay = f.donation_based
    ? f.minimum_donation
      ? `Donation from $${f.minimum_donation}`
      : 'Donation-based'
    : f.hourly_rate
      ? `$${f.hourly_rate} / session`
      : 'Rate on request'

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-md">
      {/* Card body */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Top row: avatar + identity */}
        <div className="flex items-start gap-3">
          <Avatar className="size-11 shrink-0">
            {f.avatar_url && (
              <AvatarImage src={f.avatar_url} alt={f.display_name} />
            )}
            <AvatarFallback className="bg-emerald-100 text-sm font-medium text-emerald-800">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            {/* Name + verification badge */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-stone-900">
                {f.display_name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                <ShieldCheck className="size-2.5" />
                Verified
              </span>
            </div>

            {/* Meta row: location / remote / experience */}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
              {f.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {f.location}
                </span>
              )}
              {f.remote_available && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <Video className="size-3" />
                  Remote available
                </span>
              )}
              {typeof f.years_experience === 'number' && f.years_experience > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {f.years_experience} yr{f.years_experience === 1 ? '' : 's'} exp.
                </span>
              )}
            </div>

            {/* Rating */}
            {f.avg_rating !== undefined && f.review_count !== undefined && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-700">
                  {f.avg_rating.toFixed(1)}
                </span>
                <span className="text-stone-400">
                  ({f.review_count} {f.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio excerpt */}
        <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">
          {f.bio}
        </p>

        {/* Modality badges */}
        {f.modalities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {f.modalities.slice(0, 3).map((modality) => (
              <Badge
                key={modality}
                variant="secondary"
                className="bg-stone-100 text-xs text-stone-600 hover:bg-stone-100"
              >
                {modality}
              </Badge>
            ))}
            {f.modalities.length > 3 && (
              <Badge
                variant="secondary"
                className="bg-stone-100 text-xs text-stone-400 hover:bg-stone-100"
              >
                +{f.modalities.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3">
        <span className="text-xs font-medium text-stone-500">{rateDisplay}</span>
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-600 text-xs text-emerald-700 hover:bg-emerald-50"
          asChild
        >
          <Link href={`/facilitators/${f.id}`}>View profile</Link>
        </Button>
      </div>
    </article>
  )
}
