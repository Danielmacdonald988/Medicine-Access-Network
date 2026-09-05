import Link from 'next/link'
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
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20 lg:px-8">
          <div>
            <p className="mb-6 flex items-center gap-2 text-sm font-medium tracking-wide text-emerald-200">
              <span
                className="size-2 rounded-full bg-emerald-300"
                aria-hidden
              />{' '}
              Preparation. Integration. Connection.
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Find support.
              <br />
              <span className="text-emerald-200">At your own pace.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-emerald-50/85">
              Explore preparation coaches, integration guides, and wellness
              practitioners. Make room for questions before making a commitment.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 bg-white px-6 text-base text-emerald-950 hover:bg-emerald-50"
              >
                <Link href="/facilitators">
                  Browse guides <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Link
                href="/about#profile-review"
                className="rounded text-sm font-medium text-emerald-100 underline underline-offset-4 hover:text-white"
              >
                What does profile review mean?
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-emerald-100/80">
              <Check className="size-4" aria-hidden /> No account needed to
              explore
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-2 sm:p-3">
            <h2 className="px-4 pt-3 pb-4 text-sm font-medium text-emerald-100">
              Where would you like to start?
            </h2>
            <div className="space-y-2">
              {startingPoints.map(
                ({ number, title, description, action, href, icon: Icon }) => (
                  <Link
                    key={number}
                    href={href}
                    className="group flex items-start gap-4 rounded-xl bg-white p-5 text-stone-900 transition-colors hover:bg-emerald-50"
                  >
                    <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">
                        {description}
                      </p>
                      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        {action}
                        <ArrowRight
                          className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 px-4 py-5 text-sm text-emerald-100 sm:px-6 lg:px-8">
            <span>Legal support services only</span>
            <span>Education, preparation & integration</span>
            <span>No substance sales or sourcing</span>
          </div>
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
