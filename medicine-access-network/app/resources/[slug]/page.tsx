import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Info, Siren } from 'lucide-react'
import { getResource, resources, type Block } from '@/lib/resources'

export async function generateStaticParams() {
  return resources.map((r) => ({ slug: r.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const resource = getResource(slug)
  if (!resource) return { title: 'Not found' }
  return { title: resource.title, description: resource.description }
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'h3':
      return (
        <h3 className="mt-8 mb-3 text-lg font-semibold text-stone-900 first:mt-0">
          {block.text}
        </h3>
      )

    case 'p':
      return <p className="leading-relaxed text-stone-600">{block.text}</p>

    case 'ul':
      return (
        <ul className="space-y-1.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 leading-relaxed text-stone-600">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-stone-400" />
              {item}
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="space-y-1.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 leading-relaxed text-stone-600">
              <span className="mt-0.5 shrink-0 text-sm font-semibold text-stone-400">
                {i + 1}.
              </span>
              {item}
            </li>
          ))}
        </ol>
      )

    case 'callout': {
      const styles = {
        warning: {
          wrapper: 'border-amber-200 bg-amber-50',
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          text: 'text-amber-900',
        },
        info: {
          wrapper: 'border-stone-200 bg-stone-50',
          icon: Info,
          iconColor: 'text-stone-400',
          text: 'text-stone-600',
        },
        emergency: {
          wrapper: 'border-red-200 bg-red-50',
          icon: Siren,
          iconColor: 'text-red-500',
          text: 'text-red-900',
        },
      }
      const s = styles[block.variant]
      const Icon = s.icon
      return (
        <div className={`rounded-xl border p-4 ${s.wrapper}`}>
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 size-4 shrink-0 ${s.iconColor}`} />
            <p className={`text-sm leading-relaxed ${s.text}`}>{block.text}</p>
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ResourcePage({ params }: PageProps) {
  const { slug } = await params
  const resource = getResource(slug)
  if (!resource) notFound()

  return (
    <article className="space-y-5">
      {/* Back link */}
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700"
      >
        <ArrowLeft className="size-3.5" />
        All guides
      </Link>

      {/* Header */}
      <div className="border-b border-stone-100 pb-6">
        <h1 className="text-3xl font-bold text-stone-900">{resource.title}</h1>
        <p className="mt-2 text-lg text-stone-500">{resource.subtitle}</p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {resource.blocks.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </div>

      {/* Footer disclaimer */}
      <div className="mt-10 border-t border-stone-100 pt-6 text-xs text-stone-400">
        <p>
          This guide is for general information only and is not medical advice, diagnosis, or
          treatment. Always consult a qualified healthcare provider about your individual
          situation. Guides on this platform offer legal coaching and support services — not
          therapy, diagnosis, or medical care.
        </p>
      </div>
    </article>
  )
}
