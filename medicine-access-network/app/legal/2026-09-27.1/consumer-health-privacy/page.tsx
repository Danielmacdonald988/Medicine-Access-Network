import Link from "next/link"
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Consumer Health Data Privacy Policy", alternates: { canonical: "/legal/2026-09-27.1/consumer-health-privacy" } }
const sections = [
  [
    "Operator and scope",
    "Human Intelligence Studio, Boston, Massachusetts, United States, operates The Facilitator Network. Contact adminmacmedicine@gmail.com. Effective September 27, 2026; version 2026-09-27.1. This policy addresses information that may qualify as consumer health data, including under Washington’s My Health My Data Act. It supplements our Privacy Policy and does not claim that TFN is a healthcare provider or HIPAA-covered service."
  ],
  [
    "Categories and sources",
    "Information you choose to provide can include the type of support sought, recovery-related interests, appointment preferences, and health-related information volunteered in an inquiry, application, or support message. We receive it directly from you, from a facilitator communicating with us about a request or complaint, and from use of the service. A request associated with a particular support category or facilitator may reveal a health-related interest. We do not ask for medical records, medication lists, diagnoses, or trauma histories in introductory messages. We do not use geofencing to identify visitors to healthcare facilities."
  ],
  [
    "Purposes and collection",
    "We process the information necessary to provide the directory, review applications, deliver an inquiry you request, support that request, and address safety or abuse reports. We do not use consumer health data to create advertising audiences or to infer additional diagnoses. Where applicable law requires consent beyond processing necessary to provide a requested service, we will obtain that consent before the additional collection or use."
  ],
  [
    "Sharing and recipients",
    "If you ask us to send an inquiry, the selected facilitator receives the support selection and the message together with your contact details. Our hosting, database, and email processors may process that data to provide the requested service. Those processors include Vercel, Supabase, and Resend when notification email is enabled. Authorized platform administrators can access information for administration, support, and abuse review. We do not sell consumer health data or share it for targeted advertising. We do not share it with affiliates for their own purposes. Any additional sharing requiring separate consent or sale requiring a valid authorization would require that permission first; agreeing to general site terms is not such permission."
  ],
  [
    "Your rights and requests",
    "Subject to applicable law, you may ask whether we collect, share, or sell your consumer health data; obtain access and information about recipients; withdraw consent; and request deletion, including applicable processor and backup handling. Email adminmacmedicine@gmail.com with your request and the email associated with your account or inquiry. We will verify the request without collecting unnecessary health information. Withdrawing consent does not undo processing already lawfully completed and may limit a service that needs the data. If we deny a request, reply to appeal. Washington consumers may complain to the Washington Attorney General at https://www.atg.wa.gov/file-complaint."
  ],
  [
    "Retention, outside services, and updates",
    "The retention criteria in our Privacy Policy apply, subject to applicable consumer-health-data deletion rights. We do not promise that deleting TFN records deletes copies held independently by a facilitator, search engine, or an external messaging app. Contact those recipients directly where appropriate. We will update this policy’s date and provide legally required notice or consent for material changes."
  ]
]
export default function LegalPage() { return <main lang="en" className="mx-auto w-full max-w-3xl px-5 py-12"><p className="text-sm text-stone-500">Human Intelligence Studio · Boston, Massachusetts</p><h1 className="mt-3 text-3xl font-semibold">Consumer Health Data Privacy Policy</h1><p className="mt-3 text-sm text-stone-600">Effective September 27, 2026 · Version 2026-09-27.1 · English</p><div className="mt-8 space-y-8">{sections.map(([heading,body])=><section key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-7 text-stone-700">{body}</p></section>)}</div><p className="mt-8"><a href="mailto:adminmacmedicine@gmail.com" className="underline">adminmacmedicine@gmail.com</a></p><nav aria-label="Legal documents" className="mt-8 flex flex-wrap gap-4 text-sm underline"><Link href="/privacy">Privacy</Link><Link href="/consumer-health-privacy">Consumer health data</Link><Link href="/terms">Terms</Link><Link href="/provider-agreement">Provider agreement</Link><Link href="/review-standards">Review standards</Link></nav><p className="mt-6 text-sm"><Link href="/legal/2026-09-27.1/consumer-health-privacy" className="underline">Permanent copy of this version</Link></p></main> }
