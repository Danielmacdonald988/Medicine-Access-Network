import { getSocialLinks, type SocialProfile } from '@/lib/social-links'
export function SocialLinks({ profile }: { profile: SocialProfile }) {
  const links = getSocialLinks(profile)
  if (!links.length) return null
  return <div className="mt-4 flex flex-wrap gap-2" aria-label="Social links">
    {links.map(({key,label,href})=><a key={key} href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className="rounded-md border border-stone-300 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50">{label} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>)}
  </div>
}
