import type { Metadata } from 'next'
import { getTranslation } from '@/lib/i18n/server'
import { resourceSummaries } from '@/lib/i18n/resource-summaries'
import Link from 'next/link'
import {
  BookOpen,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  HeartHandshake,
  Scale,
  Siren,
} from 'lucide-react'
import { resources } from '@/lib/resources'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Integration, Preparation & Choosing Support: Resource Library',
  description:
    'Learn what integration support can offer, prepare questions about fees and boundaries, and compare facilitator roles before you reach out.',
  alternates: { canonical: '/resources' },
}

const icons = [BookOpen, HeartHandshake, HelpCircle, AlertTriangle, ShieldCheck, Scale, Siren]

export default async function ResourcesIndexPage() {
  const { t, locale } = await getTranslation()
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">{t('Safety library')}</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          {t('Practical information about preparation, integration, and choosing support. This is not medical advice.')}
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            {t('In the US, call or text 988 for emotional distress or suicidal crisis. For immediate danger or a medical emergency, call 911. Outside the US, contact your local emergency or crisis service.')}
            <span className="mt-2 flex flex-wrap gap-4">
              <a href="tel:988" className="font-semibold underline">988 (US)</a>
              <a href="tel:911" className="font-semibold underline">911 (US)</a>
              <Link href="/resources/emergency" className="font-semibold underline">{t('Get Urgent Help')}</Link>
            </span>
          </p>
        </CardContent>
      </Card>

      <section lang="en" aria-labelledby="resource-starting-points" className="rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6">
        <h2 id="resource-starting-points" className="text-xl font-semibold text-stone-900">Where would you like to start?</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">Read at your own pace. You can explore these guides and the directory without creating an account.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold text-stone-900">Understand integration support</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Learn what a conversation after a significant experience can involve, and how it differs from clinical care.</p>
            <Link href="/resources/integration-basics" className="mt-2 inline-flex min-h-11 items-center text-sm text-emerald-800 underline underline-offset-4">Read the integration guide</Link>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Compare guides before contacting anyone</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Use questions about training, boundaries, session format, total fees and privacy to compare your options.</p>
            <Link href="/resources/questions-to-ask" className="mt-2 inline-flex min-h-11 items-center text-sm text-emerald-800 underline underline-offset-4">Get the questions-to-ask checklist</Link>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Clarify the kind of support you need</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Service labels do not establish professional qualifications. Learn what to check about a guide’s role and limits.</p>
            <Link href="/resources/scope-of-practice" className="mt-2 inline-flex min-h-11 items-center text-sm text-emerald-800 underline underline-offset-4">Understand scope of practice</Link>
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Ready to explore profiles?</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">Compare guides who list integration conversations. Confirm services, availability and location eligibility directly; an inquiry is not a booking.</p>
            <Link href="/integration-support" className="mt-2 inline-flex min-h-11 items-center text-sm text-emerald-800 underline underline-offset-4">Find integration support</Link>
          </div>
        </div>
      </section>

      <p lang="en" className="text-sm leading-relaxed text-stone-600">Unsure what a title means? <Link href="/psychedelic-facilitator" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">Learn what a psychedelic facilitator does and what to verify</Link>.</p>

      {locale !== 'en' && <p className="text-sm leading-relaxed text-stone-600">{t('The full safety articles are currently available in English. The summary below is in your selected language.')}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {resources.map((resource, i) => {
          const Icon = icons[i] ?? BookOpen
          return (
            <Link key={resource.slug} href={`/resources/${resource.slug}`} className="group">
              <Card className="h-full border-stone-200 transition-colors group-hover:border-emerald-300 group-hover:bg-emerald-50/40">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-stone-100 group-hover:bg-emerald-100">
                      <Icon className="size-4 text-stone-500 group-hover:text-emerald-700" />
                    </div>
                    <h2 className="font-semibold text-stone-900 group-hover:text-emerald-800">
                      {t(resource.title)}
                    </h2>
                  </div>
                  <p className="text-sm text-stone-500">{locale === 'en' ? resource.subtitle : t(resourceSummaries[resource.slug])}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <section aria-labelledby="downloadable-booklets" lang="en" className="space-y-4">
        <h2 id="downloadable-booklets" className="text-xl font-semibold text-stone-900">Downloadable booklets</h2>
        <Card className="border-stone-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-stone-900">Kambo &amp; Bufo</h3>
            <p className="mt-2 text-sm text-stone-600">A six-page contributor booklet. English · PDF.</p>
            <p className="mt-2 max-w-2xl text-sm text-stone-500">Contributor-provided material; its health claims have not been clinically reviewed by The Facilitator Network. This booklet is not medical advice or a recommendation to use or combine substances.</p>
            <a href="/downloads/Kambo_Bufo_Dan.pdf" download="Kambo_Bufo_Dan.pdf" className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
              Download Kambo &amp; Bufo (PDF)
            </a>
          </CardContent>
        </Card>
      </section>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
        <p className="font-medium text-stone-700">{t('A note on this library')}</p>
        <p className="mt-1">
          {t('These guides are for information only. Consult a qualified healthcare professional about your individual situation.')}
        </p>
      </div>
    </div>
  )
}
