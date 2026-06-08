import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShieldCheck,
  ShieldOff,
  BookOpen,
  UserCheck,
  ArrowRight,
  Wind,
  Sparkles,
  Flame,
  Heart,
  Brain,
  Leaf,
  Quote,
  CheckCircle2,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const trustPillars = [
  {
    icon: ShieldOff,
    heading: 'Not a drug marketplace',
    body: 'We do not sell, source, or coordinate access to substances of any kind. This platform exists for legal support services only.',
  },
  {
    icon: ShieldCheck,
    heading: 'Safety-first discovery',
    body: 'Every facilitator profile includes visible safety practices, contraindication screening, and an acknowledgement of their ethical boundaries.',
  },
  {
    icon: BookOpen,
    heading: 'Preparation and integration centred',
    body: 'We built this specifically for the before and after — the most underserved parts of a transformative experience.',
  },
  {
    icon: UserCheck,
    heading: 'Human-reviewed facilitators',
    body: 'No profile goes live without a manual review by our admin team. Verification is required — not optional.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Share what kind of support you need',
    body: 'Tell us where you are in your journey — curious and researching, actively preparing, or working to integrate an experience. Set your preferences in private.',
  },
  {
    n: '02',
    title: 'Browse verified facilitators',
    body: 'Every guide on this platform has been reviewed before appearing publicly. Read bios, safety practices, modalities, and honest reviews from real seekers.',
  },
  {
    n: '03',
    title: 'Request a conversation',
    body: 'Send a private booking request. No commitment, no payment upfront — just a message to start a thoughtful conversation about fit.',
  },
  {
    n: '04',
    title: 'Prepare and integrate with support',
    body: 'Work with your guide before and after. Build a framework of intention, safety, and meaning around the experience — not just the experience itself.',
  },
]

const modalities = [
  {
    icon: Brain,
    name: 'Integration Coaching',
    desc: 'Making sense of what happened. Translating insight into lasting change.',
    href: '/facilitators?modality=Integration+Coaching',
    accent: 'bg-violet-50 text-violet-700',
    ring: 'ring-violet-200',
  },
  {
    icon: Leaf,
    name: 'Preparation Support',
    desc: 'Building the container. Setting intentions, understanding risks, creating safety.',
    href: '/facilitators?modality=Preparation+Coaching',
    accent: 'bg-emerald-50 text-emerald-700',
    ring: 'ring-emerald-200',
  },
  {
    icon: Wind,
    name: 'Breathwork',
    desc: 'Holotropic and conscious-connected approaches to non-ordinary states.',
    href: '/facilitators?modality=Breathwork',
    accent: 'bg-sky-50 text-sky-700',
    ring: 'ring-sky-200',
  },
  {
    icon: Heart,
    name: 'Somatic Support',
    desc: 'Body-based healing. Processing and completing what the nervous system holds.',
    href: '/facilitators?modality=Somatic+Coaching',
    accent: 'bg-rose-50 text-rose-700',
    ring: 'ring-rose-200',
  },
  {
    icon: Sparkles,
    name: 'Meditation & Mindfulness',
    desc: 'Stabilising attention. Deepening your relationship with present-moment experience.',
    href: '/facilitators?modality=Meditation+Guidance',
    accent: 'bg-amber-50 text-amber-700',
    ring: 'ring-amber-200',
  },
  {
    icon: Flame,
    name: 'Recovery-adjacent Support',
    desc: 'For those navigating healing at the intersection of plant medicine and recovery.',
    href: '/facilitators?modality=Recovery+Support',
    accent: 'bg-orange-50 text-orange-700',
    ring: 'ring-orange-200',
  },
]

const testimonials = [
  {
    quote:
      'I had no idea where to start or who to trust. Finding a preparation coach here completely changed my sense of safety going into the experience. It made all the difference.',
    name: 'M.T.',
    role: 'Seeker',
  },
  {
    quote:
      'The integration support I found here helped me make lasting meaning from what happened. That process was just as important as the experience itself — maybe more so.',
    name: 'J.R.',
    role: 'Seeker',
  },
  {
    quote:
      'As a guide, being on a platform that actually takes legal compliance seriously gives me peace of mind. This is how the field should operate.',
    name: 'Anonymous',
    role: 'Verified Guide',
  },
]

const facilitatorPerks = [
  'Free to apply — no listing fees',
  'Admin-reviewed before going public',
  'Legal services only — clear ethical framework',
  'Your own verified profile with reviews',
  'Private booking request inbox',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="grain relative isolate overflow-hidden bg-stone-950 px-6 pt-24 pb-28 sm:px-8 lg:px-12 lg:pt-32 lg:pb-36">

        {/* Ambient glows — give the dark background depth and a living quality */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-48 left-1/4 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-emerald-900/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-stone-800/50 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-4xl">

          {/* Eyebrow badge */}
          <div className="flex justify-center">
            <Badge className="mb-8 border border-emerald-700/40 bg-emerald-950/60 px-3 py-1 text-xs font-medium tracking-wide text-emerald-400 backdrop-blur-sm hover:bg-emerald-950/60">
              Trusted facilitator discovery
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find trusted support for{' '}
            <br className="hidden sm:block" />
            preparation, integration,{' '}
            <br className="hidden sm:block" />
            <span className="text-emerald-400">
              and medicine-adjacent healing.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-7 max-w-2xl text-center text-lg leading-relaxed text-stone-300 sm:text-xl">
            A safer way to discover experienced facilitators, integration guides,
            breathwork practitioners, and preparation coaches.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 w-full bg-emerald-600 px-8 text-base font-semibold text-white hover:bg-emerald-500 sm:w-auto"
              asChild
            >
              <Link href="/facilitators">
                Find support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full border-stone-600 bg-transparent px-8 text-base font-medium text-stone-200 hover:border-stone-400 hover:bg-stone-900 hover:text-white sm:w-auto"
              asChild
            >
              <Link href="/onboarding/facilitator">Apply as a facilitator</Link>
            </Button>
          </div>

          {/* Legal micro-copy */}
          <p className="mt-5 text-center text-xs tracking-wide text-stone-500">
            Legal support services only &middot; Not a marketplace for substances &middot; No medical claims
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. TRUST PILLARS                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              What makes this different
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Built for trust from the ground up
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-500">
              Most people exploring this space struggle to find who is safe, experienced, and ethical.
              We built this platform specifically to solve that problem.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustPillars.map(({ icon: Icon, heading, body }) => (
              <div
                key={heading}
                className="flex flex-col gap-4 rounded-2xl border border-stone-100 bg-stone-50 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
                  <Icon className="h-5 w-5 text-stone-700" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-stone-900">{heading}</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. HOW IT WORKS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-stone-50 px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">

          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              The process
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-base text-stone-500">
              Private, pressure-free, and built around your pace.
            </p>
          </div>

          {/* Steps grid — 2-col on md, 4-col on lg */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ n, title, body }, i) => (
              <div key={n} className="relative flex flex-col gap-4">

                {/* Connector line between steps on large screens */}
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute top-5 left-[calc(100%_-_8px)] hidden h-px w-full lg:block"
                    style={{
                      background:
                        'linear-gradient(90deg, oklch(0.7 0.1 160 / 0.4) 0%, transparent 100%)',
                    }}
                  />
                )}

                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white"
                  >
                    {n}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug text-stone-900">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. FEATURED MODALITIES                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">

          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Areas of practice
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Support for every part of the journey
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-stone-500">
              Find facilitators who specialise in the specific kind of support you are looking for —
              before, during the integration phase, or both.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modalities.map(({ icon: Icon, name, desc, href, accent, ring }) => (
              <Link
                key={name}
                href={href}
                className={`group flex items-start gap-4 rounded-2xl border bg-stone-50 p-6 transition-all hover:shadow-md hover:ring-1 ${ring} hover:bg-white`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent} ring-1 ${ring}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {name}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{desc}</p>
                </div>
                <ArrowRight className="mt-0.5 ml-auto h-4 w-4 shrink-0 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button variant="outline" className="border-stone-200 text-stone-600 hover:border-emerald-500 hover:text-emerald-700" asChild>
              <Link href="/facilitators">
                Browse all guides <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. TESTIMONIALS                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-stone-50 px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">

          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              From the community
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              People doing serious personal work
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map(({ quote, name, role }) => (
              <div
                key={name + role}
                className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-7"
              >
                <div>
                  <Quote className="mb-4 h-5 w-5 text-emerald-200" strokeWidth={1.5} />
                  <p className="text-sm leading-7 text-stone-600">{quote}</p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-200 to-stone-200" />
                  <div>
                    <p className="text-xs font-semibold text-stone-800">{name}</p>
                    <p className="text-xs text-stone-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. DUAL CTA — seeker + facilitator                                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">

          {/* Seeker panel */}
          <div className="relative isolate overflow-hidden rounded-3xl bg-stone-900 px-8 py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-900/40 blur-2xl"
            />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                For seekers
              </p>
              <h3 className="mt-3 text-2xl font-bold text-white">
                Ready to find support?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-400">
                Browse verified guides who offer preparation coaching, integration support,
                breathwork, somatic work, and more.
              </p>
              <Button
                size="lg"
                className="mt-7 bg-emerald-600 text-white hover:bg-emerald-500"
                asChild
              >
                <Link href="/facilitators">
                  Find support <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Facilitator panel */}
          <div className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-stone-50 px-8 py-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                For facilitators
              </p>
              <h3 className="mt-3 text-2xl font-bold text-stone-900">
                Apply as a guide
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                Join a platform built around trust, legal compliance, and ethical practice.
              </p>
              <ul className="mt-5 space-y-2">
                {facilitatorPerks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="mt-7 border-stone-300 text-stone-800 hover:border-emerald-500 hover:text-emerald-700"
              asChild
            >
              <Link href="/onboarding/facilitator">
                Apply as a facilitator <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. LEGAL DISCLAIMER BAND                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-stone-200 bg-stone-100 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <Separator className="mb-6 bg-stone-200" />
          <p className="text-center text-xs leading-relaxed text-stone-500">
            <span className="font-semibold text-stone-600">Legal notice — </span>
            This platform does not sell, provide, source, or coordinate access to controlled
            substances. It is for education, discovery, preparation, integration, and legal wellness
            services only. Nothing on this platform constitutes medical advice, diagnosis, or
            treatment. Always consult a licensed healthcare provider for medical concerns.
          </p>
        </div>
      </section>

    </div>
  )
}
