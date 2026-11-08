import { EducationalAttribution } from '@/components/educational-attribution'
import type { Metadata } from 'next'
import { getTranslation } from '@/lib/i18n/server'
import { resourceSummaries } from '@/lib/i18n/resource-summaries'
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
  const { t, locale } = await getTranslation()
  return {
    title: locale === 'en' ? resource.searchTitle ?? resource.title : t(resource.title),
    description: locale === 'en' ? resource.description : t(resourceSummaries[slug]),
    alternates: { canonical: `/resources/${resource.slug}` },
  }
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'h3':
      return (
        <h3 id={block.id} className="scroll-mt-24 mt-8 mb-3 text-lg font-semibold text-stone-900 first:mt-0">
          {block.text}
        </h3>
      )

    case 'p':
      if (!block.links) return <p className="leading-relaxed text-stone-600">{block.text}</p>
      return (
        <div className="space-y-2">
          <p className="leading-relaxed text-stone-600">{block.text}</p>
          {block.links && <ul className="flex flex-wrap gap-2">
            {block.links.map((link) => <li key={link.href}>
              <a href={link.href} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800 px-3 py-2 text-sm font-medium text-emerald-900 underline underline-offset-4 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900">{link.label}</a>
            </li>)}
          </ul>}
        </div>
      )

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
  const { t, locale } = await getTranslation()
  const { slug } = await params
  const resource = getResource(slug)
  if (!resource) notFound()
  const summary = resourceSummaries[slug]
  const translatedSummary = t(summary)
  const hasTranslatedSummary = translatedSummary !== summary

  return (
    <article className="space-y-5">
      {/* Back link */}
      <Link
        href="/resources"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700"
      >
        <ArrowLeft className="size-3.5" />
        {t('Safety library')}
      </Link>

      {/* Header */}
      <div className="border-b border-stone-100 pb-6">
        <h1 className="text-3xl font-bold text-stone-900">{t(resource.title)}</h1>
        <p lang="en" className="mt-2 text-lg text-stone-500">{resource.subtitle}</p>
        <EducationalAttribution />
      </div>

      {locale !== 'en' && <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-sm text-stone-600">{hasTranslatedSummary ? t('The full safety articles are currently available in English. The summary below is in your selected language.') : 'This article is currently available in English.'}</p>
        <p lang={hasTranslatedSummary ? locale : 'en'} className="leading-relaxed text-stone-800">{translatedSummary}</p>
        <a href="#original-article" className="inline-flex min-h-11 items-center font-medium text-emerald-800 underline underline-offset-4">{t('Read the full article in English')}</a>
      </section>}
      <div id="original-article" lang="en" className="scroll-mt-28 space-y-5">
      {locale !== 'en' && <h2 className="text-lg font-semibold">Original English article</h2>}
      {slug === 'integration-basics' && <p className="text-sm leading-relaxed text-stone-600">
        Ready to compare approaches? <Link href="/integration-support" className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">Explore guides who list integration conversations</Link>. You can keep reading before deciding.
      </p>}
      {slug === 'questions-to-ask' && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="comparison-worksheet">
        <h2 id="comparison-worksheet" className="text-xl font-semibold text-stone-900">Compare options at your own pace</h2>
        <p className="mt-2 leading-relaxed text-stone-700">Use this blank, two-page worksheet to compare two facilitators side by side. Print it and keep your notes privately. No account or online answers are needed; do not include health history or other sensitive personal information.</p>
        <details className="mt-3 text-sm leading-relaxed text-stone-700">
          <summary className="min-h-11 cursor-pointer py-3 font-medium text-emerald-900">Read all worksheet prompts on this page</summary>
          <p className="mb-3">For each question, compare Option A and Option B in your own private notes.</p>
          <dl className="space-y-3">
            <div><dt className="font-semibold">Proposed service &amp; scope</dt><dd>What is included? What is not? Is this preparation, integration, or another service?</dd></div>
            <div><dt className="font-semibold">Qualifications &amp; checks</dt><dd>Record claimed training/license, issuing body, and a source to check independently. A claim is not verification.</dd></div>
            <div><dt className="font-semibold">Format &amp; location eligibility</dt><dd>In person or online? Where may this person provide this exact service? Confirm your location is eligible.</dd></div>
            <div><dt className="font-semibold">Fees &amp; duration</dt><dd>Session length, total price/currency, required extras, and any ongoing commitment.</dd></div>
            <div><dt className="font-semibold">Cancellation &amp; refunds</dt><dd>Notice required, cancellation charges, deposits, and refund terms.</dd></div>
            <div><dt className="font-semibold">Consent &amp; boundaries</dt><dd>How can you decline, pause or stop? Ask about touch, confidentiality limits and professional boundaries.</dd></div>
            <div><dt className="font-semibold">Privacy &amp; contact</dt><dd>What information is requested, who can see it, how is it kept, and which contact method can you use?</dd></div>
            <div><dt className="font-semibold">Scope limits &amp; referrals</dt><dd>What is outside their role? How do they handle concerns or refer someone to appropriate support?</dd></div>
            <div><dt className="font-semibold">Unanswered questions</dt><dd>What needs clarification in writing? Note any pressure, vague claims or terms you do not understand.</dd></div>
            <div><dt className="font-semibold">Your next step</dt><dd>Compare answers, verify claims, ask more, or decide not to proceed. There is no obligation to choose.</dd></div>
          </dl>
        </details>
        <a href="/downloads/TFN-facilitator-comparison.pdf" download className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900">Download comparison worksheet (PDF, 2 pages)</a>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">This is a comparison aid, not a safety score, provider verification or clinical endorsement. You can ask more questions or decide not to proceed.</p>
      </section>}
      {/* Content */}
      <div className="space-y-4">
        {resource.blocks.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}
      </div>

      {resource.sourceCheck && (
        <section className="rounded-xl border border-stone-200 bg-stone-50 p-5" aria-labelledby="resource-sources">
          <h2 id="resource-sources" className="text-sm font-semibold text-stone-900">
            Sources and service information
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            {resource.sourceCheck.scope}{' '}
            Last checked{' '}
            <time dateTime={resource.sourceCheck.date}>
              {new Date(`${resource.sourceCheck.date}T12:00:00Z`).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
              })}
            </time>.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {resource.sourceCheck.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} className="text-emerald-800 underline underline-offset-4 hover:text-emerald-950">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {resource.nextStep && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="resource-next-step">
        <h2 id="resource-next-step" className="text-lg font-semibold text-stone-900">Explore your options</h2>
        <p className="mt-2 leading-relaxed text-stone-700">{resource.nextStep.description}</p>
        <Link href={resource.nextStep.href} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 py-3 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900">{resource.nextStep.label}</Link>
      </section>}
      {resource.relatedSlugs && <nav aria-label="Related reading" className="rounded-xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900">Keep exploring</h2>
        <ul className="mt-2 space-y-1">{resource.relatedSlugs.map((relatedSlug) => {
          const related = getResource(relatedSlug)
          return related ? <li key={relatedSlug}><Link href={`/resources/${relatedSlug}`} className="inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4">{related.title}</Link></li> : null
        })}</ul>
      </nav>}

      {/* Footer disclaimer */}
      <div className="mt-10 border-t border-stone-100 pt-6 text-xs text-stone-400">
        <p>
          This guide is for general information only and is not medical advice, diagnosis, or
          treatment. Always consult a qualified healthcare provider about your individual
          situation. A directory listing does not establish clinical qualifications or that a service is
          permitted in every location. Confirm the guide’s role, any claimed license, and
          whether they may provide the proposed service where you live.
        </p>
      </div>
      </div>
    </article>
  )
}
