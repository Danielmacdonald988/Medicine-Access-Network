import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About & profile review',
  description:
    'Understand what profile review means, its limits, and how to make an informed choice when looking for support.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-emerald-800">About the network</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Support starts with an informed choice.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        The Facilitator Network helps people discover preparation coaches,
        integration guides, breathwork practitioners, and other wellness
        support. You can explore profiles and educational resources without
        creating an account.
      </p>
      <section
        id="profile-review"
        className="mt-10 scroll-mt-24 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8"
      >
        <ShieldCheck className="mb-4 size-7 text-emerald-800" aria-hidden />
        <h2 className="text-2xl font-semibold">
          What “Profile reviewed” means
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          A profile marked “Profile reviewed” has been approved by an
          administrator for inclusion in the public directory. Applications
          include the guide’s description of their practice, training,
          experience, and safety boundaries.
        </p>
        <h3 className="mt-6 font-semibold">What it does not mean</h3>
        <p className="mt-2 leading-relaxed text-stone-600">
          Approval is not a medical license, an independent certification of
          every claim, or a guarantee of safety, suitability, or outcomes.
          Training and experience are described by the guide. If a guide claims
          a professional license, check it with the issuing organization.
        </p>
        <p className="mt-4 leading-relaxed text-stone-600">
          Read the profile carefully, ask about fees and boundaries, and decide
          whether the guide’s scope fits your needs. A guide should make room
          for questions and respect a decision to decline.
        </p>
        <Link
          href="/resources/questions-to-ask"
          className="mt-5 inline-flex items-center gap-2 font-medium text-emerald-800 underline underline-offset-4"
        >
          Questions to ask a guide <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">
          Keep the first conversation simple
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          Sending a request starts a conversation; it does not confirm a
          booking. Share the kind of support you want, a preferred format, and
          questions about fit. Avoid sending medical records or sensitive
          personal history in a request.
        </p>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Clear limits</h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          This platform is for legal education and wellness support. It does not
          sell or source substances and does not provide medical advice,
          diagnosis, treatment, or emergency care.
        </p>
        <p className="mt-4 leading-relaxed text-stone-600">
          For a concern about a listing or your experience,{' '}
          <Link
            href="/contact"
            className="font-medium text-emerald-800 underline underline-offset-4"
          >
            contact the platform
          </Link>
          . For immediate danger, contact local emergency services; platform
          support is not an emergency response service.
        </p>
      </section>
    </div>
  )
}
