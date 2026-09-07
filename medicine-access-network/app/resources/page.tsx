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
  title: 'Safety Library',
  description:
    'Grounded guides on preparation, integration, facilitator safety, contraindications, and more.',
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

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
        <p className="font-medium text-stone-700">{t('A note on this library')}</p>
        <p className="mt-1">
          {t('These guides are for information only. Consult a qualified healthcare professional about your individual situation.')}
        </p>
      </div>
    </div>
  )
}
