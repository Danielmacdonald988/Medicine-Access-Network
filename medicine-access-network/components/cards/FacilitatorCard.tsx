 'use client'
import Link from 'next/link'
import { useTranslation } from '@/components/i18n/TranslationProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { FacilitatorSearchResult } from '@/lib/types'
import { profileServices } from '@/lib/constants'
import { getProfileImageUrl } from '@/lib/profile-media'
import styles from './provider-row.module.css'

export function FacilitatorCard({ facilitator: f }: { facilitator: FacilitatorSearchResult }) {
  const { t } = useTranslation()
  const photo = getProfileImageUrl(f.image_paths?.[0])
  const href = `/facilitators/${f.id}`
  const rate = f.donation_based ? (typeof f.minimum_donation === 'number' ? t('Suggested donation from ${amount} USD', { amount:f.minimum_donation }) : t('Donation-based')) : typeof f.hourly_rate === 'number' ? t('${amount} USD per session', {amount:f.hourly_rate}) : t('Rate on request')
  return <article className={styles.row}>
    <Link href={href} tabIndex={-1} aria-hidden="true" className={styles.photo}><Avatar className="h-full w-full rounded-md">
      {photo && <AvatarImage src={photo} alt="" className="object-cover" />}
      <AvatarFallback>{f.display_name.slice(0,2)}</AvatarFallback>
    </Avatar></Link>
    <div className={styles.content}>
      <div className={styles.identity}><h3><Link href={href}>{f.display_name}</Link></h3><span>{f.location}{f.remote_available && ` · ${t('Online sessions')}`}</span></div>
      <div className={styles.services}>{profileServices(f.modalities).map(name=><Link key={name} href={href} aria-label={`${t(name)} — ${t('View {name}’s profile', {name:f.display_name})}`}><span aria-hidden="true">✓</span> {t(name)}</Link>)}</div>
      <p className={styles.meta}>{typeof f.years_experience === 'number' && <>{t('{years} years of practice (self-reported)',{years:f.years_experience})} · </>}{rate}</p>
    </div>
    <Link href={href} className={styles.view} aria-label={t('View {name}’s profile',{name:f.display_name})}>{t('View')} →</Link>
  </article>
}
