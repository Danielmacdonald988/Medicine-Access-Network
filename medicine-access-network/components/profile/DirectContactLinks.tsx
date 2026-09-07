'use client'

import { useTranslation } from '@/components/i18n/TranslationProvider'

import { ExternalLink, MessageCircle } from 'lucide-react'
import { getDirectContactLinks, type DirectContactProfile } from '@/lib/direct-contact'

export function DirectContactLinks({ profile, compact = false }: { profile: DirectContactProfile; compact?: boolean }) {
  const { t } = useTranslation()
  const links = getDirectContactLinks(profile)
  if (!links.length) return null

  return <div className="space-y-3">
    <p className="text-sm font-semibold text-stone-900">{t("Message directly")}</p>
    <div className="flex flex-col gap-2">
      {links.map(({ platform, label, href }) => (
        <a
          key={platform}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          aria-label={`${t('Message on {service}', { service: label })} ${t('(opens the app or a new tab)')}`}
          className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${platform === 'signal' ? 'bg-blue-700 hover:bg-blue-800' : platform === 'telegram' ? 'bg-sky-700 hover:bg-sky-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
        >
          <MessageCircle aria-hidden="true" className="size-5 shrink-0" />{compact ? label : t('Message on {service}', { service: label })}
          <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="sr-only">{' '}{t("(opens the app or a new tab)")}</span>
        </a>
      ))}
    </div>
    {compact ? <details className="text-xs leading-relaxed text-stone-600">
      <summary className="cursor-pointer py-1 underline underline-offset-4">{t("How it works")}</summary>
      <p className="mt-2">{t("Opens the app or a new tab. Your message goes directly to the guide in that service and is not stored in your guide’s website inbox. That service’s privacy settings apply.")}</p>
    </details> : <p className="text-xs leading-relaxed text-stone-600">{t("Opens the app or a new tab. Your message goes directly to the guide in that service and is not stored in your guide’s website inbox. That service’s privacy settings apply.")}</p>}
  </div>
}
