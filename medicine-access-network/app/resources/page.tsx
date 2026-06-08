import type { Metadata } from 'next'
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

export default function ResourcesIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Safety Library</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Grounded, practical information about preparation, integration, finding the right guide,
          and knowing when to seek clinical or emergency support. Nothing here is medical advice.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900">
            If you are in crisis right now, please stop and contact a crisis service.
            In the US, call or text{' '}
            <a href="tel:988" className="font-semibold underline">
              988
            </a>
            {' '}or call{' '}
            <a href="tel:911" className="font-semibold underline">
              911
            </a>
            . See our{' '}
            <Link href="/resources/emergency" className="font-semibold underline">
              Emergency Disclaimer
            </Link>
            {' '}for more resources.
          </p>
        </CardContent>
      </Card>

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
                      {resource.title}
                    </h2>
                  </div>
                  <p className="text-sm text-stone-500">{resource.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-500">
        <p className="font-medium text-stone-700">A note on this library</p>
        <p className="mt-1">
          These guides are for information and orientation only. They are not a substitute for
          professional medical or mental health advice. Always consult a qualified healthcare
          provider about your individual situation. Guides on this platform offer legal coaching
          and support services — not therapy, diagnosis, or medical care.
        </p>
      </div>
    </div>
  )
}
