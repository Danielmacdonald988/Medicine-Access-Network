import Link from 'next/link'
import type { Metadata } from 'next'
import { APP_NAME, APP_TAGLINE, SITE_URL } from '@/lib/constants'
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Wind,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HomeSearch } from '@/components/search/HomeSearch'

export const metadata: Metadata = {
  title: `Psychedelic Preparation & Integration — ${APP_NAME}`,
  description: APP_TAGLINE,
  alternates: { canonical: '/' },
  openGraph: {
    title: `Psychedelic Preparation & Integration — ${APP_NAME}`,
    description: APP_TAGLINE,
    url: SITE_URL,
  },
}

const startingPoints = [
  {
    number: '01',
    title: 'I’m exploring',
    description:
      'Understand the options and the questions to ask before choosing support.',
    action: 'Start with the safety library',
    href: '/resources',
    icon: Compass,
  },
  {
    number: '02',
    title: 'I’m preparing',
    description:
      'Find a coach to discuss intentions, boundaries, and preparation.',
    action: 'Find preparation support',
    href: '/facilitators?modality=Preparation+Coaching',
    icon: Leaf,
  },
  {
    number: '03',
    title: 'I’m integrating',
    description:
      'Find someone to talk with about an experience and what comes next.',
    action: 'Find integration support',
    href: '/facilitators?modality=Integration+Coaching',
    icon: MessageCircle,
  },
]

const practices = [
  ['Breathwork', 'Breathwork'],
  ['Somatic support', 'Somatic Coaching'],
  ['Meditation & mindfulness', 'Meditation Guidance'],
  ['Recovery support', 'Recovery Support'],
]

const questions = [
  [
    'What training is relevant to my needs?',
    'Ask about specific training, experience, and the limits of their practice. Check any claimed professional license with its issuing body.',
  ],
  [
    'What will a session cost and involve?',
    'Discuss the format, fees or suggested donation, cancellation terms, and what happens before agreeing to a session.',
  ],
  [
    'How do you handle consent and boundaries?',
    'Ask how a guide responds if you say no, need to pause, or want a different kind of support. You can decide a guide is not a fit.',
  ],
]

export default function Home() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: APP_NAME,
        url: SITE_URL,
      }).replace(/</g, '\\u003c') }} />
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-8">
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-medium tracking-wide text-emerald-200 sm:mb-6">
              <span
                className="size-2 rounded-full bg-emerald-300"
                aria-hidden
              />{' '}
              Preparation. Integration. Connection.
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Psychedelic support.
              <br />
              <span className="text-emerald-200">At your own pace.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-emerald-50/85 sm:mt-6 sm:text-lg">
              Find facilitators for psychedelic preparation and integration.
              Compare approaches and fees, then start a conversation.
            </p>
            <div className="mt-8 hidden flex-wrap items-center gap-4 lg:flex">
              <Link href="#process-heading" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline underline-offset-4">How it works <ArrowRight className="size-4" aria-hidden /></Link>
              <Link
                href="/about#profile-review"
                className="rounded text-sm font-medium text-emerald-100 underline underline-offset-4 hover:text-white"
              >
                What does profile review mean?
              </Link>
            </div>
            <p className="mt-5 hidden items-center gap-2 text-sm text-emerald-100/80 lg:flex">
              <Check className="size-4" aria-hidden /> No account needed to
              explore or contact a guide
            </p>
          </div>
          <HomeSearch />
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 px-4 py-5 text-sm text-emerald-100 sm:px-6 lg:px-8">
            <span>Legal support services only</span>
            <span>Education, preparation & integration</span>
            <span>No substance sales or sourcing</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="starting-point-heading" className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <h2 id="starting-point-heading" className="text-2xl font-semibold tracking-tight">Not sure where to start?</h2>
        <p className="mt-2 text-stone-600">Choose the step that feels closest to where you are.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {startingPoints.map(({ number, title, description, action, href, icon: Icon }) => (
            <Link key={number} href={href} className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition-colors hover:border-emerald-600">
              <Icon className="mb-4 size-6 text-emerald-700" aria-hidden />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">{action}<ArrowRight className="size-4 shrink-0" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
        aria-labelledby="practice-heading"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-800">
              More ways to find support
            </p>
            <h2
              id="practice-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Explore by practice
            </h2>
          </div>
          <Link
            href="/facilitators?remote=true"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"
          >
            Browse online support <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {practices.map(([label, modality]) => (
            <Link
              key={modality}
              href={`/facilitators?modality=${encodeURIComponent(modality)}`}
              className="group flex min-h-20 items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-5 font-medium text-stone-800 transition-colors hover:border-emerald-600 hover:text-emerald-800"
            >
              {label}
              <ArrowRight
                className="size-4 shrink-0 text-emerald-700"
                aria-hidden
              />
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-600">
          Not sure which practice fits?{' '}
          <Link
            href="/resources/questions-to-ask"
            className="font-medium text-emerald-800 underline underline-offset-4"
          >
            Start with questions to ask a guide.
          </Link>
        </p>
      </section>

      <section
        className="border-y border-stone-200 bg-white"
        aria-labelledby="trust-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
          <div>
            <ShieldCheck
              className="mb-5 size-8 text-emerald-800"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-sm font-medium text-emerald-800">
              A profile is a starting point
            </p>
            <h2
              id="trust-heading"
              className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              Trust deserves
              <br />
              more than a badge.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-stone-600">
              Profiles require admin approval before they appear in the
              directory. That review is not a clinical credential or a guarantee
              of safety or results.
            </p>
            <Link
              href="/about#profile-review"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Understand profile review{' '}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              Bring these questions to a first conversation
            </h3>
            <div className="divide-y divide-stone-200">
              {questions.map(([title, body], index) => (
                <div key={title} className="flex gap-5 py-5">
                  <span className="pt-0.5 font-mono text-sm text-emerald-700">
                    0{index + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="mt-2 leading-relaxed text-stone-600">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/resources/red-flags"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"
            >
              Recognize red flags <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        aria-labelledby="process-heading"
      >
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-800">
            From browsing to a conversation
          </p>
          <h2
            id="process-heading"
            className="mt-3 text-3xl font-semibold tracking-tight"
          >
            A little clarity before the next step.
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Compass,
              title: 'Explore without an account',
              body: 'Browse profiles, compare practices and rates, and read the safety library. There is no need to share your story to start.',
            },
            {
              icon: MessageCircle,
              title: 'Ask about fit',
              body: 'Send a request from a guide’s profile, with your name, email, and a brief introduction. No account is needed.',
            },
            {
              icon: Wind,
              title: 'Decide on your terms',
              body: 'A guide can reply by email. Discuss scope, fees, and boundaries before agreeing to work together.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t-2 border-emerald-800 pt-5">
              <Icon
                className="mb-5 size-6 text-emerald-800"
                strokeWidth={1.5}
                aria-hidden
              />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 leading-relaxed text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="border-t border-stone-200 bg-white"
        aria-labelledby="questions-heading"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
          <div>
            <BookOpen className="mb-4 size-6 text-emerald-800" aria-hidden />
            <h2
              id="questions-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              Good questions.
              <br />
              Clear answers.
            </h2>
          </div>
          <div className="divide-y divide-stone-200">
            {[
              [
                'Do I need to know exactly what I’m looking for?',
                'No. Start with the safety library or browse profiles. You can take time to learn the differences between practices before reaching out.',
              ],
              [
                'Does sending a request book or charge me?',
                'No. A conversation request starts a discussion about fit. It does not confirm a session, and no payment is required to send it.',
              ],
              [
                'Should I share medical information in my first message?',
                'Keep it brief: the support you want and your preferred format are enough. Leave out diagnoses, medications, trauma details, and other sensitive information. Discuss any necessary screening directly with an appropriately qualified professional.',
              ],
              [
                'Can I find or buy substances here?',
                'No. The platform is for legal education and wellness support, including preparation and integration. It does not sell, source, or coordinate access to controlled substances.',
              ],
            ].map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer pr-4 font-semibold marker:text-emerald-700">
                  {question}
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-stone-600">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-50">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              For facilitators
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Bring your practice to the network.
            </h2>
            <p className="mt-2 text-stone-600">
              Free to apply. Profiles require review before publication.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 bg-emerald-800 text-base hover:bg-emerald-900"
          >
            <Link href="/onboarding/facilitator">
              Apply as a guide <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
