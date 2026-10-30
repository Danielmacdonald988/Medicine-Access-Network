import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getTranslation } from '@/lib/i18n/server'
import { FacilitatorCard } from '@/components/cards/FacilitatorCard'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { INTEGRATION_DIRECTORY_HREF, loadIntegrationGuides } from '@/lib/integration-support'

export const metadata: Metadata = {
  title: 'Find Psychedelic Integration Support | Compare Guides',
  description: 'Explore guides who list integration conversations. Compare their approach, ask about scope, fees and session format, and request a conversation without an account.',
  alternates: { canonical: '/integration-support' },
}

const linkStyle = 'inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4'

async function IntegrationGuides() {
  const { locale } = await getTranslation()
  let result: Awaited<ReturnType<typeof loadIntegrationGuides>>
  try {
    result = await loadIntegrationGuides(await createServerSupabaseClient())
  } catch {
    result = { status: 'unavailable', guides: [], total: 0 }
  }
  if (result.status === 'unavailable') return <p role="status" className="rounded-xl border border-stone-200 p-5">Guide profiles could not be loaded right now. You can still read the comparison questions below or <Link className={linkStyle} href={INTEGRATION_DIRECTORY_HREF}>try the integration directory</Link>.</p>
  if (!result.guides.length) return <p role="status" className="rounded-xl border border-stone-200 p-5">No public profiles currently list integration conversations. <Link className={linkStyle} href="/facilitators">Explore other listed support</Link> without assuming it offers the same service.</p>
  return <>
    <p className="mb-4 text-sm text-stone-600">Showing {result.guides.length} of {result.total} matching profiles, alphabetically. Placement is not a recommendation or quality rating.</p>
    <div lang={locale} className="grid gap-3">{result.guides.map(guide => <FacilitatorCard key={guide.id} facilitator={guide} />)}</div>
    <Link className={`${linkStyle} mt-3`} href={INTEGRATION_DIRECTORY_HREF}>See all integration profiles and filter your options →</Link>
  </>
}

export default function IntegrationSupportPage() {
  return <div lang="en" className="network-shell space-y-10 py-8 sm:py-12">
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Find your support</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-stone-900 sm:text-5xl">Find integration support</h1>
      <p className="mt-5 text-lg leading-relaxed text-stone-600">Looking for someone to talk with after a psychedelic or other significant personal experience? Compare guides who list integration conversations, understand what they offer, and decide whether to reach out.</p>
      <p className="mt-4 leading-relaxed text-stone-600">Integration support can mean space to reflect, explore meaning and consider everyday changes. Each guide defines their own approach. It does not require another psychedelic experience, and this directory does not supply, source or administer substances or arrange access to them.</p>
      <a href="#integration-guides" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-5 py-3 font-medium text-white hover:bg-emerald-800">Explore integration guides</a>
      <p className="mt-3 text-sm text-stone-600">No account needed. An inquiry is not a booking, payment or guarantee of a reply.</p>
    </header>

    <section id="integration-guides" aria-labelledby="guides-heading" className="scroll-mt-24">
      <h2 id="guides-heading" className="text-2xl font-medium text-stone-900">Guides who list integration conversations</h2>
      <p className="mb-5 mt-3 max-w-3xl leading-relaxed text-stone-600">These are current public directory listings, not verified availability. Services, experience and prices are self-reported. A listed city is not a confirmed service area; ask whether the guide can work with you where you live, online or in person, and confirm the total fee.</p>
      <Suspense fallback={<p role="status" className="py-8 text-stone-600">Loading current public profiles…</p>}><IntegrationGuides /></Suspense>
      <Link className={`${linkStyle} mt-3`} href="/about#profile-review">What profile review does—and does not—mean</Link>
    </section>

    <section aria-labelledby="compare-heading" className="max-w-3xl rounded-2xl bg-stone-50 p-6 sm:p-8">
      <h2 id="compare-heading" className="text-2xl font-medium text-stone-900">Before you choose a guide</h2>
      <ol className="mt-4 list-decimal space-y-4 pl-5 leading-relaxed text-stone-600">
        <li><strong className="text-stone-900">Check the role.</strong> Ask what a session involves, what is outside their scope and what training supports that specific service. Independently verify any claimed professional license; a listing is not a clinical credential.</li>
        <li><strong className="text-stone-900">Agree on boundaries.</strong> Ask how you can pause, decline a practice or end a session, how confidentiality works and when they would refer you elsewhere.</li>
        <li><strong className="text-stone-900">Confirm practical details.</strong> Ask about your location, session format, time zone, availability, session length, total fees and cancellation terms before committing.</li>
      </ol>
      <Link className={`${linkStyle} mt-3`} href="/resources/questions-to-ask">Use the full questions-to-ask checklist</Link>
    </section>

    <section aria-labelledby="contact-heading" className="max-w-3xl">
      <h2 id="contact-heading" className="text-2xl font-medium text-stone-900">Start with a practical question, not your history</h2>
      <p className="mt-3 leading-relaxed text-stone-600">Open a profile to see its contact options. You might ask: “Could you explain your integration approach, session format, fees and current availability?” Keep diagnoses, medication lists, trauma details and substance use history out of the introductory platform message. Ask how any necessary private intake is handled before sharing sensitive information.</p>
      <p className="mt-3 leading-relaxed text-stone-600">You can compare several approaches, take time to decide or choose not to proceed. You do not need to accept a guide’s interpretation of your experience.</p>
    </section>

    <aside className="max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-xl font-medium text-stone-900">Integration conversations are not clinical or emergency care</h2>
      <p className="mt-3 leading-relaxed text-stone-700">TFN is a discovery directory, not a treatment provider. For health concerns or distress that affects daily functioning, seek an appropriately licensed healthcare professional. Do not wait for a directory reply in an emergency; contact local emergency services.</p>
      <Link className={`${linkStyle} mt-2`} href="/resources/emergency">Read urgent-support information</Link>
    </aside>
    <nav aria-label="Learn about integration" className="flex max-w-3xl flex-col items-start border-t border-stone-200 pt-5">
      <Link className={linkStyle} href="/resources/integration-basics">New to integration? Read what to expect</Link>
      <Link className={linkStyle} href="/resources/spiritual-support">Considering spiritual support? Explore the differences</Link>
      <Link className={linkStyle} href="/facilitators">Browse all support categories</Link>
    </nav>
  </div>
}
