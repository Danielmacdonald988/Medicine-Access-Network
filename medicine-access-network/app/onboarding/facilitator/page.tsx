import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { FacilitatorOnboardingForm } from '@/components/forms/FacilitatorOnboardingForm'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Apply as a guide' }

const REQUIREMENTS = [
  'Legal services only — preparation, integration, breathwork, somatic coaching, education',
  'No facilitation of illegal ceremonies or coordination of substance procurement',
  'Detailed safety practice documentation is required',
  'Contraindication awareness acknowledgement is required',
  'Admin review before your profile appears publicly',
]

export default async function FacilitatorOnboardingPage() {
  const user = await requireAuth()

  // Seekers and admins don't apply as facilitators via this flow
  if (user.role === 'admin') redirect('/admin')

  // If they already submitted an application, send them to their dashboard
  const supabase = await createServerSupabaseClient()
  const { data: existing } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/facilitator')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
          Facilitator application
        </p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Apply as a guide</h1>
        <p className="mt-2 text-stone-500">
          Submit your profile for review. Our team verifies every application before
          your listing appears publicly — typically within 3–5 business days.
        </p>
      </div>

      <Card className="mb-8 border-stone-200">
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-semibold text-stone-700">Platform requirements</p>
          <ul className="space-y-2">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-stone-600">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {r}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <FacilitatorOnboardingForm />
    </div>
  )
}
