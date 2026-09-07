import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowUpRight } from 'lucide-react'
import { SITE_URL, SUPPORT_EMAIL } from '@/lib/constants'
import { getTranslation } from '@/lib/i18n/server'
import { z } from 'zod'

export const metadata: Metadata = {
  title: 'Contact & report a concern',
  description: 'Contact The Facilitator Network for website help, listing questions, or concerns about a guide.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ profile?: string | string[] }> }) {
  const { t } = await getTranslation()
  const query = await searchParams
  const parsed = z.string().uuid().safeParse(query.profile)
  const profileId = parsed.success ? parsed.data : null
  const profilePath = profileId ? `/facilitators/${profileId}` : null
  const emailParams = profilePath ? new URLSearchParams({
    subject: t('Concern about a guide profile'),
    body: `${SITE_URL}${profilePath}\n\n${t('Describe the concern and how you would like us to respond. Include only the information needed to understand the issue.')}\n\n`,
  }) : null
  const emailHref = `mailto:${SUPPORT_EMAIL}${emailParams ? `?${emailParams}` : ''}`
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-emerald-800">{t('Help & concerns')}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t('Talk to the platform.')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">{t('Email us for website help, profile questions, or concerns about a guide.')}</p>
      {profilePath && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-950">{t('Report a concern about this profile')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-900">{t('The email link includes the profile address. Review and edit your email before sending it.')}</p>
          <Link href={profilePath} className="mt-3 inline-block text-sm font-medium text-emerald-800 underline underline-offset-4">{t('Return to the guide’s profile')}</Link>
        </div>
      )}
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <Mail className="mb-4 size-7 text-emerald-800" aria-hidden />
        <h2 className="text-xl font-semibold">{t('Email support')}</h2>
        <a href={emailHref} className="mt-3 inline-flex max-w-full items-center gap-2 break-all text-lg font-medium text-emerald-800 underline underline-offset-4">
          {SUPPORT_EMAIL}<ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </a>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">{t('Opens your email app. You can also copy this address into your preferred email service.')}</p>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">{t('If you’re reporting a concern')}</h2>
        <p className="mt-4 leading-relaxed text-stone-600">{t('Include the profile link, a brief description, and how we can reply. Leave out medical records, passwords, payment details, and other people’s private information.')}</p>
        <p className="mt-4 leading-relaxed text-stone-600">{t('You do not need to contact the guide first.')}</p>
        <Link href="/resources/red-flags" className="mt-3 inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4">{t('Recognizing red flags')}</Link>
      </section>
      <aside className="mt-10 rounded-xl border border-stone-200 p-6">
        <h2 className="font-semibold">{t('This inbox is not an emergency service')}</h2>
        <p className="mt-2 leading-relaxed text-stone-600">{t('For immediate danger, contact local emergency services. Platform support is not an emergency service.')}</p>
        <Link href="/resources/emergency" className="mt-3 inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4">{t('Get Urgent Help')}</Link>
      </aside>
    </div>
  )
}
