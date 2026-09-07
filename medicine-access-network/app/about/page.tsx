import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { getTranslation } from '@/lib/i18n/server'

export const metadata: Metadata = {
  title: 'About & profile review',
  description: 'Understand what profile review means, its limits, and how to make an informed choice when looking for support.',
}

export default async function AboutPage() {
  const { t } = await getTranslation()
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-emerald-800">{t('About the network')}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t('Support starts with an informed choice.')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">{t('Discover preparation, integration, breathwork, and wellness support. Explore profiles and resources without creating an account.')}</p>
      <section id="profile-review" className="mt-10 scroll-mt-24 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8">
        <ShieldCheck className="mb-4 size-7 text-emerald-800" aria-hidden />
        <h2 className="text-2xl font-semibold">{t('What “Profile reviewed” means')}</h2>
        <p className="mt-4 leading-relaxed text-stone-600">{t('An administrator has approved the profile for the public directory. Training, experience, and safety practices are described by the guide.')}</p>
        <h3 className="mt-6 font-semibold">{t('What it does not mean')}</h3>
        <p className="mt-2 leading-relaxed text-stone-600">{t('Approval is not a medical license, independent verification of every claim, or a guarantee of safety or results. Check any claimed license with its issuing organization.')}</p>
        <p className="mt-4 leading-relaxed text-stone-600">{t('Ask about fees, qualifications, and boundaries. Decide whether the service fits your needs. You have the right to ask questions and decline.')}</p>
        <Link href="/resources/questions-to-ask" className="mt-5 inline-flex items-center gap-2 font-medium text-emerald-800 underline underline-offset-4">{t('Questions to ask a guide')} <ArrowRight className="size-4 shrink-0" aria-hidden /></Link>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">{t('Keep the first conversation simple')}</h2>
        <p className="mt-4 leading-relaxed text-stone-600">{t('A request starts a conversation, not a confirmed booking. Share the support you want and your preferred format. Leave medical records and sensitive personal history out of introductory messages.')}</p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">{t('Clear limits')}</h2>
        <p className="mt-4 leading-relaxed text-stone-600">{t('This platform is for legal education and wellness support. It does not sell or source substances, or provide medical advice, diagnosis, treatment, or emergency care.')}</p>
        <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4">{t('Contact the platform or report a concern')}</Link>
        <p className="mt-2 leading-relaxed text-stone-600">{t('For immediate danger, contact local emergency services. Platform support is not an emergency service.')}</p>
      </section>
    </div>
  )
}
