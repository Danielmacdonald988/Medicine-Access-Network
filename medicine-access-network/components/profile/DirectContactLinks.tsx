import { ExternalLink, MessageCircle } from 'lucide-react'
import { getDirectContactLinks, type DirectContactProfile } from '@/lib/direct-contact'

export function DirectContactLinks({ profile }: { profile: DirectContactProfile }) {
  const links = getDirectContactLinks(profile)
  if (!links.length) return null

  return <div className="space-y-3">
    <p className="text-sm font-semibold text-stone-900">Message directly</p>
    <div className="flex flex-col gap-2">
      {links.map(({ platform, label, href }) => (
        <a
          key={platform}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
          Message on {label}
          <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="sr-only"> (opens the app or a new tab)</span>
        </a>
      ))}
    </div>
    <p className="text-xs leading-relaxed text-stone-600">
      Opens the app or a new tab. Your message goes directly to the guide in that
      service and is not stored in your guide’s website inbox. That service’s
      privacy settings apply.
    </p>
  </div>
}
