import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Provider Agreement", alternates: { canonical: "/legal/2026-09-27.1/provider-agreement" } }
const sections = [
  [
    "Parties and acceptance",
    "This agreement is between the adult applicant/provider accepting it and Human Intelligence Studio, Boston, Massachusetts, United States, operator of The Facilitator Network. Contact adminmacmedicine@gmail.com. Effective September 27, 2026; version 2026-09-27.1. Acceptance includes the Terms of Use and acknowledgment of the Privacy Policy. We record your account, version, and acceptance time. Existing applicants are not deemed to have accepted this version without a new acceptance."
  ],
  [
    "Accurate application and public listing",
    "Provide accurate service selections, experience, locations, fees, photographs, and contact destinations. Explain training and safety practices sufficiently for administrative review without including client records or another person’s confidential information. Bios, training descriptions, certifications, and safety narratives are restricted application information. Public listing fields are described in the Privacy Policy. You authorize the public display of the fields and links you choose for an approved listing, including phone numbers disclosed by messaging links."
  ],
  [
    "Your responsibilities",
    "Offer only services lawful where provided and within your qualifications. Do not diagnose, treat, prescribe, or perform other regulated work without the required authorization. Do not use TFN listings, inquiries, or linked contact channels to source, supply, arrange access to controlled substances, or facilitate illegal ceremonies. Do not make unsupported medical, safety, or outcome claims. A category selection does not authorize a service or establish a qualification."
  ],
  [
    "Review, changes, and removal",
    "Human Intelligence Studio may request clarification, reject or hide a listing, and review complaints. Administrative approval is not an endorsement, professional certification, or verification of all claims. Practice changes require further approval under the application workflow. Public contact links can be updated separately, but you remain responsible for their accuracy and ownership. We may restrict a listing while concerns are investigated and will consider relevant clarification sent to our contact email. Review standards are published separately."
  ],
  [
    "Working with people who contact you",
    "You independently decide whether you can responsibly provide the requested support and communicate your scope, boundaries, qualifications, location limits, fees, cancellation terms, and appropriate consent process. Medical or clinical eligibility questions must be referred to an appropriately qualified professional when outside your scope. Do not treat an introductory inquiry as consent to a service. Arrange any necessary sensitive intake through an appropriate confidential process, not a public profile or initial TFN message."
  ],
  [
    "Inquiries and privacy",
    "Use inquiry details only to respond to and manage the service the person requested, meet applicable obligations, and address relevant disputes or safety issues. Do not add a seeker to marketing lists without an appropriate separate permission. Protect information you receive, limit access, respond to applicable privacy requests, and tell Human Intelligence Studio promptly about misuse or unauthorized access involving TFN inquiry information. Provide your own privacy information where required. You are responsible for information independently retained in your records and messaging accounts."
  ],
  [
    "Independent services and ending the relationship",
    "You provide services independently; listing alone does not make you an employee, agent, healthcare provider for TFN, or partner of Human Intelligence Studio. You set and explain your service terms and remain responsible for applicable licenses, insurance requirements, taxes, and professional duties. TFN does not promise leads, bookings, earnings, or outcomes. You may request removal of your listing or account; applicable data-retention exceptions are described in the Privacy Policy. Mandatory legal rights remain unaffected."
  ]
]
export default function LegalPage() { return <main lang="en" className="mx-auto w-full max-w-3xl px-5 py-12"><p className="text-sm text-stone-500">Human Intelligence Studio · Boston, Massachusetts</p><h1 className="mt-3 text-3xl font-semibold">Provider Agreement</h1><p className="mt-3 text-sm text-stone-600">Effective September 27, 2026 · Version 2026-09-27.1 · English</p><div className="mt-8 space-y-8">{sections.map(([heading,body])=><section key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-7 text-stone-700">{body}</p></section>)}</div><p className="mt-8"><a href="mailto:adminmacmedicine@gmail.com" className="underline">adminmacmedicine@gmail.com</a></p><nav aria-label="Legal documents" className="mt-8 flex flex-wrap gap-4 text-sm underline"><Link href="/privacy">Privacy</Link><Link href="/consumer-health-privacy">Consumer health data</Link><Link href="/terms">Terms</Link><Link href="/provider-agreement">Provider agreement</Link><Link href="/review-standards">Review standards</Link></nav><p className="mt-6 text-sm"><Link href="/legal/2026-09-27.1/provider-agreement" className="underline">Permanent copy of this version</Link></p></main> }
