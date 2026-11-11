import { EducationalAttribution } from '@/components/educational-attribution'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Psychedelic Facilitator: Roles, Credentials & Finding Support',
  description: 'What does psychedelic facilitator mean? Compare preparation and integration support, understand role boundaries, and ask practical questions before choosing a guide.',
  alternates: { canonical: '/psychedelic-facilitator' },
}

const linkStyle = 'inline-flex min-h-11 items-center text-emerald-800 underline underline-offset-4'

export default function PsychedelicFacilitatorPage() {
  return <article lang="en" className="network-shell max-w-4xl space-y-9 py-8 sm:py-12">
    <header>
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Understand your options</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-stone-900 sm:text-5xl">What is a psychedelic facilitator?</h1>
      <EducationalAttribution />
      <p className="mt-5 text-lg leading-relaxed text-stone-700">People use “psychedelic facilitator” to describe different roles: preparation education, support during an experience, or integration conversations afterward. The title alone does not tell you which service someone offers, whether they hold a professional license, or where they may work.</p>
      <p className="mt-4 leading-relaxed text-stone-600">The Facilitator Network helps adults explore preparation, integration and related nonadministration support. TFN does not sell, source, administer or arrange access to controlled substances. If you are looking for a reflective conversation rather than a substance session, you can compare profiles without an account.</p>
      <Link href="/integration-support" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-5 py-3 font-medium text-white hover:bg-emerald-800">Compare integration support</Link>
    </header>

    <section aria-labelledby="roles-heading">
      <h2 id="roles-heading" className="text-2xl font-medium text-stone-900">Start with the service, not the title</h2>
      <dl className="mt-5 space-y-5 leading-relaxed text-stone-600">
        <div><dt className="font-semibold text-stone-900">Preparation education</dt><dd className="mt-1">A conversation about intentions, questions, expectations and boundaries. Ask what the guide actually covers. Education is not a medical assessment, a recommendation to take a substance, or authorization to do so.</dd></div>
        <div><dt className="font-semibold text-stone-900">Integration conversations</dt><dd className="mt-1">Space to reflect on a psychedelic or other significant experience and consider what it means in everyday life. You do not need another psychedelic experience to seek this kind of support. Guides may use different approaches; ask how a session works.</dd></div>
        <div><dt className="font-semibold text-stone-900">Facilitation during an experience</dt><dd className="mt-1">This is a different service from a preparation or integration conversation. Requirements depend on the jurisdiction and activity. TFN is not a booking or referral service for substance administration, and a directory listing does not establish permission to provide it.</dd></div>
        <div><dt className="font-semibold text-stone-900">Clinical care</dt><dd className="mt-1">A facilitator or coach title is not evidence of a clinical license. If you need assessment or treatment, seek an appropriately licensed healthcare professional. Someone may hold more than one qualification; clarify which role they are acting in for the proposed session.</dd></div>
      </dl>
      <Link href="/resources/scope-of-practice" className={`${linkStyle} mt-3`}>Learn more about scope of practice</Link>
    </section>

    <section aria-labelledby="credentials-heading" className="rounded-2xl bg-stone-50 p-6 sm:p-8">
      <h2 id="credentials-heading" className="text-2xl font-medium text-stone-900">What does “licensed” or “certified” mean?</h2>
      <p className="mt-3 leading-relaxed text-stone-600">Ask who issued the credential, what it covers, whether it is current and how to check it independently. A training certificate, professional license and directory approval are different things. Do not assume that one substitutes for another.</p>
      <p className="mt-3 leading-relaxed text-stone-600">For example, Oregon has a specific psilocybin facilitator license described by the Oregon Health Authority. That is a jurisdiction-specific role, not a universal credential for everyone using the words “psychedelic facilitator.” This example is not a claim that TFN profiles hold that license.</p>
      <a href="https://www.oregon.gov/oha/ph/preventionwellness/pages/psilocybin-license-facilitator.aspx" className={`${linkStyle} mt-2`}>Read Oregon Health Authority’s facilitator-license explanation</a>
      <p className="mt-3 text-sm text-stone-600">TFN profile approval is administrative review, not independent verification of qualifications or a guarantee of safety or results.</p>
      <Link href="/about#profile-review" className={linkStyle}>What TFN profile review means</Link>
    </section>

    <section aria-labelledby="questions-heading">
      <h2 id="questions-heading" className="text-2xl font-medium text-stone-900">Questions to ask a prospective guide</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-stone-600">
        <li>What exact service would we agree to, and what is outside your role?</li>
        <li>What relevant training or license do you hold, and how can I check it?</li>
        <li>Can you provide this service where I live? A home city or online-session option does not establish client-location eligibility.</li>
        <li>What are the format, session length, total fee and cancellation terms?</li>
        <li>How do consent, confidentiality, declining an exercise and ending a session work?</li>
        <li>When would you refer someone to a different professional rather than continue?</li>
      </ol>
      <p className="mt-4 leading-relaxed text-stone-600">Keep diagnoses, medication lists, trauma details and substance-use history out of a first platform message. Ask how any necessary private intake is handled before sharing sensitive information. An inquiry does not book a session, charge you or guarantee a reply.</p>
      <Link href="/resources/questions-to-ask" className={`${linkStyle} mt-2`}>Use the full comparison checklist</Link>
    </section>

    <nav aria-label="Explore preparation and integration" className="flex flex-col items-start border-t border-stone-200 pt-5">
      <Link href="/integration-support" className={linkStyle}>Compare guides who list integration conversations</Link>
      <Link href="/resources/preparation-basics" className={linkStyle}>Prepare for a conversation with a guide</Link>
      <Link href="/facilitators" className={linkStyle}>Browse preparation, spiritual and somatic support profiles</Link>
    </nav>
    <p className="text-sm leading-relaxed text-stone-600">General educational information, not medical or legal advice. TFN is not an emergency service. For immediate danger, contact local emergency services rather than waiting for a directory reply.</p>
  </article>
}
