import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowUpRight } from 'lucide-react'
import { SUPPORT_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact & report a concern',
  description:
    'Contact The Facilitator Network for website help, listing questions, or concerns about a guide.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-emerald-800">Help & concerns</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Talk to the platform.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-stone-600">
        For a website issue, a question about your profile, or a concern about a
        guide, email us directly.
      </p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
        <Mail className="mb-4 size-7 text-emerald-800" aria-hidden />
        <h2 className="text-xl font-semibold">Email support</h2>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-3 inline-flex max-w-full items-center gap-2 break-all text-lg font-medium text-emerald-800 underline underline-offset-4"
        >
          {SUPPORT_EMAIL}
          <ArrowUpRight className="size-4 shrink-0" aria-hidden />
        </a>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          Opens your email app. You can also copy the address into your
          preferred email service.
        </p>
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold">
          If you’re reporting a concern
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">
          Include the guide’s profile link, a brief description of the issue,
          and how you would like us to reply. Share only what is necessary;
          leave out medical records, passwords, payment details, and other
          people’s private information.
        </p>
        <p className="mt-4 leading-relaxed text-stone-600">
          You do not need to contact the guide first. You can also read our{' '}
          <Link
            href="/resources/red-flags"
            className="font-medium text-emerald-800 underline underline-offset-4"
          >
            guide to recognizing red flags
          </Link>
          .
        </p>
      </section>
      <aside className="mt-10 rounded-xl border border-stone-200 p-6">
        <h2 className="font-semibold">
          This inbox is not an emergency service
        </h2>
        <p className="mt-2 leading-relaxed text-stone-600">
          If someone is in immediate danger, contact local emergency services.
          For more information, see{' '}
          <Link
            href="/resources/emergency"
            className="font-medium text-emerald-800 underline underline-offset-4"
          >
            urgent support resources
          </Link>
          .
        </p>
      </aside>
    </div>
  )
}
