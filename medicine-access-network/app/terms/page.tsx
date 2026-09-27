import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } }
const sections = [
  [
    "Who we are and scope",
    "These terms describe use of The Facilitator Network, operated by Human Intelligence Studio in Boston, Massachusetts, United States. Contact adminmacmedicine@gmail.com. Effective September 27, 2026; version 2026-09-27.1. They apply when you expressly accept them in a TFN form. Providers also agree to the Provider Agreement. Our Privacy Policy describes information handling; agreement to these terms is not consent to unrelated marketing or optional health-data sharing."
  ],
  [
    "An introduction service",
    "TFN helps adults discover independently provided support and contact facilitators. It does not provide medical care, psychotherapy, diagnosis, treatment, emergency response, or a professional relationship with the platform. A profile selection, saved guide, inquiry, or reply is not a confirmed appointment. Reach agreement directly with the provider about suitability, services, location, fees, cancellation, consent, and boundaries before a session."
  ],
  [
    "Listings and administrative approval",
    "Providers supply their listing information. Listing approval means permission to publish after administrative review, not independent identity, license, qualification, insurance, legality, or safety certification, endorsement, or a promise of results. Read our Review Standards for the process. Check claims and ask questions appropriate to your needs. We may remove or restrict a listing for incomplete information, unresolved concerns, misleading claims, prohibited activity, or other misuse."
  ],
  [
    "Acceptable use",
    "Do not use TFN to seek, supply, arrange, or advertise prohibited substances or unlawful services; impersonate someone; submit false or misleading information; harass others; publish someone else’s confidential information; infringe rights; or bypass access controls. Providers must act within applicable law and their qualifications. Do not submit another person’s medical or client records. Introductory messages should not contain sensitive medical histories."
  ],
  [
    "Accounts and communications",
    "Provider accounts are for adults 18 and older. Keep your account and contact details accurate and protect access to your sign-in email. Notify us of suspected misuse. Inquiries are shared with the selected provider as explained in the Privacy Policy. External messaging and social services have separate terms. Support is not continuously monitored for emergencies; call local emergency services when needed."
  ],
  [
    "Content and rights",
    "You retain rights to content you submit. You give Human Intelligence Studio the permission needed to store and process it for the functions you request: assessing applications, displaying approved public listing fields and photos, delivering messages, and providing support. This does not authorize publication of restricted application narratives or unrelated advertising use. Submit only material you have the right to provide. Removing a listing stops future display on TFN but may not remove third-party copies."
  ],
  [
    "Fees, disputes, and availability",
    "Exploring the directory and sending a website inquiry do not require payment to TFN. A displayed rate is supplied by the provider, not a charge or confirmed quote. Confirm the provider’s own payment, refund, and cancellation terms directly. Contact the provider about their service and tell TFN about listing or platform concerns. We do not guarantee availability, response times, uninterrupted access, or outcomes. We may restrict misuse or suspend features to address security, legal, or operational issues."
  ],
  [
    "Responsibility and applicable rights",
    "Each party remains responsible for its own conduct and obligations under applicable law. Nothing here excludes liability or consumer rights that cannot lawfully be excluded. These terms do not waive claims involving our own conduct or force confidential arbitration. Massachusetts law governs to the extent permitted, without displacing mandatory protections that apply where you live. Contact adminmacmedicine@gmail.com to raise a concern."
  ],
  [
    "Changes and ending use",
    "You can stop using TFN, request removal of your listing, or request account deletion using the privacy contact. Retention exceptions are explained in the Privacy Policy. Material changes to accepted terms will be dated and presented for renewed acceptance where required; we will not treat an existing user as having accepted a new version merely because we published it."
  ]
]
export default function LegalPage() { return <main lang="en" className="mx-auto w-full max-w-3xl px-5 py-12"><p className="text-sm text-stone-500">Human Intelligence Studio · Boston, Massachusetts</p><h1 className="mt-3 text-3xl font-semibold">Terms of Use</h1><p className="mt-3 text-sm text-stone-600">Effective September 27, 2026 · Version 2026-09-27.1 · English</p><div className="mt-8 space-y-8">{sections.map(([heading,body])=><section key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-7 text-stone-700">{body}</p></section>)}</div><p className="mt-8"><a href="mailto:adminmacmedicine@gmail.com" className="underline">adminmacmedicine@gmail.com</a></p><nav aria-label="Legal documents" className="mt-8 flex flex-wrap gap-4 text-sm underline"><Link href="/privacy">Privacy</Link><Link href="/consumer-health-privacy">Consumer health data</Link><Link href="/terms">Terms</Link><Link href="/provider-agreement">Provider agreement</Link><Link href="/review-standards">Review standards</Link></nav><p className="mt-6 text-sm"><Link href="/legal/2026-09-27.1/terms" className="underline">Permanent copy of this version</Link></p></main> }
