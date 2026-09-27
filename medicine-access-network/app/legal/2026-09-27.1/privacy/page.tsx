import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/legal/2026-09-27.1/privacy" } }
const sections = [
  [
    "Who operates this site",
    "The Facilitator Network (TFN) is operated by Human Intelligence Studio in Boston, Massachusetts, United States. For privacy questions, access, correction, deletion, or complaints, email adminmacmedicine@gmail.com. This policy is effective September 27, 2026, version 2026-09-27.1."
  ],
  [
    "Information we collect",
    "Facilitator accounts include name, email, optional Instagram username, authentication records, and application information. Applications include service selections, location, experience, rates, photographs, contact links, biography, training, certifications, safety responses, and agreement acceptance. We retain administrative review decisions and notes. Website inquiries include the sender’s name, email, selected guide, requested support, message, format, and preferred time. We also process support correspondence, voluntarily submitted reviews, and technical/security information such as request and device information."
  ],
  [
    "What is public and what is restricted",
    "An approved, public listing displays the facilitator’s name, location, selected services, self-reported experience, rates, photos, and chosen contact/social links. WhatsApp and phone-based Signal links can reveal a telephone number. Public listings and published reviews may be indexed or copied by others. Biography, training narratives, certifications, and safety responses are restricted to the applicant and authorized administrators in our application system; they are not published in the directory. Hosting and database service providers process these records to operate the service. The platform previously published some approved profile narratives. Removing them from TFN cannot remove copies already held by visitors, search engines, or other independent parties."
  ],
  [
    "How and why we use information",
    "We use information to authenticate accounts, assess and manage applications, display approved listings, deliver inquiries, provide support, prevent abuse, investigate complaints, maintain security, and document agreements and review decisions. Administrative approval is not credential verification or a guarantee of safety. Do not include client records or other people’s sensitive information in an application."
  ],
  [
    "Inquiries and external messaging",
    "When you submit a website inquiry, we store it and make it available to the selected facilitator. Email notifications may contain the inquiry and your reply email. Platform administrators may access records for support, administration, and abuse investigation. Use introductory messages for basic support preferences, not medical records, medication lists, or trauma histories. Clicking WhatsApp, Signal, Telegram, or a social link opens an external service governed by that service’s policy. Conversations sent there are not stored in TFN’s inquiry system. Facilitators independently control information they receive and may retain their own copies."
  ],
  [
    "Service providers and other disclosures",
    "Our service uses Supabase for authentication, database, and photo storage; Vercel for hosting and traffic analytics; and, when email delivery is enabled, Resend for notification delivery. These providers process information necessary for those functions. Requests sent to our privacy/support email are processed by the email service used for that mailbox. We may disclose information when required by law, to protect rights and security, or to professional advisers subject to appropriate confidentiality obligations. We do not sell personal information or share it for cross-context behavioral advertising. We do not use inquiry content or application narratives for advertising audiences."
  ],
  [
    "Browser storage and analytics",
    "Authentication uses browser/session mechanisms needed to sign in. Saved-guide IDs and language preferences may be stored in your browser. Our own engagement measurement uses a tab identifier lasting up to 24 hours and records action names, application step numbers, broad referral sources, and device types. It excludes names, emails, messages, search text, and the identities of guides viewed. These engagement records expire after 90 days and are cleared when new activity is recorded. This measurement honors Do Not Track and Global Privacy Control. Separate traffic analytics are supplied by Vercel. Essential authentication, security, and request delivery continue when optional measurement is disabled. External services you choose to visit may use their own tracking."
  ],
  [
    "Retention and deletion",
    "We retain account and application information while needed to operate the account and review listings. Inquiry records are retained to deliver and manage conversations and resolve support or abuse issues. Agreement and review records may be retained after a listing is removed where needed to document decisions, resolve disputes, or satisfy legal obligations. These records do not currently have a single automatic deletion deadline. You can request deletion by email; we assess what can be deleted, explain applicable exceptions, and address relevant service-provider copies. Deleted information may remain in protected backups until those backups expire, and we do not restore it for ordinary use. Public copies and information held independently by a facilitator or messaging service are outside our direct control."
  ],
  [
    "Your choices and rights",
    "You can edit your application and public contact links through your account, or request access, correction, deletion, or removal of a public listing at adminmacmedicine@gmail.com. Depending on where you live, additional rights may include a copy of your information, withdrawal of consent, restriction or objection, an authorized-agent request, or an appeal. We verify requests proportionately and do not ask you to email medical records or identity documents unless necessary through an appropriate process. If we deny a request, you may ask us to reconsider at the same email. You may also contact your local privacy regulator. We will not discriminate against you for exercising applicable privacy rights."
  ],
  [
    "Health-related information",
    "Support selections or messages can reveal health-related interests even though TFN is not a treatment service. Our separate Consumer Health Data Privacy Policy explains this information, necessary sharing, and request rights. We do not represent that all TFN information is protected by HIPAA."
  ],
  [
    "Location, age, security, and changes",
    "Human Intelligence Studio operates in the United States; our providers may process information in the United States and other places where they operate. We use access restrictions and other safeguards, but no system is perfectly secure. The service is intended for adults 18 and older, and we do not knowingly solicit personal information from children. Contact us if a child has provided information. We will publish policy changes with an updated date and give additional notice or seek consent where required before a materially different use. Prior policy versions remain available through their version links."
  ]
]
export default function LegalPage() { return <main lang="en" className="mx-auto w-full max-w-3xl px-5 py-12"><p className="text-sm text-stone-500">Human Intelligence Studio · Boston, Massachusetts</p><h1 className="mt-3 text-3xl font-semibold">Privacy Policy</h1><p className="mt-3 text-sm text-stone-600">Effective September 27, 2026 · Version 2026-09-27.1 · English</p><div className="mt-8 space-y-8">{sections.map(([heading,body])=><section key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-7 text-stone-700">{body}</p></section>)}</div><p className="mt-8"><a href="mailto:adminmacmedicine@gmail.com" className="underline">adminmacmedicine@gmail.com</a></p><nav aria-label="Legal documents" className="mt-8 flex flex-wrap gap-4 text-sm underline"><Link href="/privacy">Privacy</Link><Link href="/consumer-health-privacy">Consumer health data</Link><Link href="/terms">Terms</Link><Link href="/provider-agreement">Provider agreement</Link><Link href="/review-standards">Review standards</Link></nav><p className="mt-6 text-sm"><Link href="/legal/2026-09-27.1/privacy" className="underline">Permanent copy of this version</Link></p></main> }
