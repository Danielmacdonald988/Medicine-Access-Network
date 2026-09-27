import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Administrative Review Standards", alternates: { canonical: "/review-standards" } }
const sections = [
  [
    "What approval means",
    "Listing approved means an administrator has allowed a listing to be published. It does not mean independent verification of identity, credentials, insurance, legal eligibility, clinical suitability, or safety, and does not guarantee outcomes. These standards apply to approval decisions made under version 2026-09-27.1, effective September 27, 2026. Earlier listings are not represented as having passed a newly introduced checklist."
  ],
  [
    "Required administrative checks",
    "Before approving a new or resubmitted application, an administrator reviews: required details and completeness; selected services for consistency with the application and platform boundaries; training and safety responses for missing information or obvious inconsistencies; photos and supplied contact destinations for relevance and apparent ownership; and recorded acceptance of the current agreement. The reviewer checks for prohibited offers, unsupported claims, client information, and unresolved concerns. If information is insufficient or conflicting, the application stays unpublished while clarification is requested or is rejected."
  ],
  [
    "What the record contains",
    "The approval form requires the administrator to confirm completion of this checklist. TFN records the reviewer account, decision, checklist version, timestamp, and any decision note in the same database transaction as publication. Applicant agreement acceptance is recorded separately. A checked administrative checklist is not evidence of a professional credential check."
  ],
  [
    "Ongoing concerns",
    "Practice edits return the listing to review. Contact-link edits can save separately; TFN does not continuously monitor providers or external conversations. Report misleading information, misuse, or other concerns through the Contact page or adminmacmedicine@gmail.com. We can restrict or remove a listing while a concern is assessed. Do not send medical or client records with an initial report. Emergencies require local emergency services, not a platform report."
  ]
]
export default function LegalPage() { return <main lang="en" className="mx-auto w-full max-w-3xl px-5 py-12"><p className="text-sm text-stone-500">Human Intelligence Studio · Boston, Massachusetts</p><h1 className="mt-3 text-3xl font-semibold">Administrative Review Standards</h1><p className="mt-3 text-sm text-stone-600">Effective September 27, 2026 · Version 2026-09-27.1 · English</p><div className="mt-8 space-y-8">{sections.map(([heading,body])=><section key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-7 text-stone-700">{body}</p></section>)}</div><p className="mt-8"><a href="mailto:adminmacmedicine@gmail.com" className="underline">adminmacmedicine@gmail.com</a></p><nav aria-label="Legal documents" className="mt-8 flex flex-wrap gap-4 text-sm underline"><Link href="/privacy">Privacy</Link><Link href="/consumer-health-privacy">Consumer health data</Link><Link href="/terms">Terms</Link><Link href="/provider-agreement">Provider agreement</Link><Link href="/review-standards">Review standards</Link></nav><p className="mt-6 text-sm"><Link href="/legal/2026-09-27.1/review-standards" className="underline">Permanent copy of this version</Link></p></main> }
