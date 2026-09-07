import { getTranslation } from '@/lib/i18n/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { FacilitatorOnboardingForm } from '@/components/forms/FacilitatorOnboardingForm'
import { Card, CardContent } from '@/components/ui/card'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation()
  return { title: t('Apply as a guide') }
}

const REQUIREMENTS = [
  'Legal services only — preparation, integration, breathwork, somatic coaching, education',
  'No facilitation of illegal ceremonies or coordination of substance procurement',
  'At least one profile photo is required; JPG, PNG, or WebP, up to 4 MB',
  'Detailed safety practice documentation is required',
  'Contraindication awareness acknowledgement is required',
  'Admin review before your profile appears publicly',
]

export default async function FacilitatorOnboardingPage() {
  const { t } = await getTranslation()
  const user = await requireAuth()

  // Admins use the separate administration workflow.
  if (user.role === 'admin') redirect('/admin')

  // If they already submitted an application, send them to their dashboard
  const supabase = await createServerSupabaseClient()
  const { data: existing, error } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-stone-900">{t("Your application could not be loaded")}</h1>
        <p className="text-stone-600">{t("Please try again before starting an application.")}</p>
        <Link href="/onboarding/facilitator" className="text-sm font-medium text-emerald-800 underline">{t("Try again")}</Link>
      </div>
    )
  }
  if (existing) redirect('/facilitator')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">{t("Facilitator application")}</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{t("Apply as a guide")}</h1>
        <p className="mt-2 text-stone-500">{t("Submit your profile for review before it can appear publicly. Approval is an administrative decision to include a profile, not verification of a clinical license or a guarantee of safety. Check your dashboard for updates.")}</p>
      </div>

      <Card className="mb-8 border-stone-200">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold text-stone-700">{t("Platform requirements")}</p>
          <ul className="space-y-2">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-stone-600">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {t(r)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <FacilitatorOnboardingForm />
    </div>
  )
}
