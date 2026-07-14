import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { SeekerOnboardingForm } from '@/components/forms/SeekerOnboardingForm'

export const metadata: Metadata = { title: 'Tell us about your journey' }

export default async function SeekerOnboardingPage() {
  const user = await requireAuth()

  // Facilitators and admins don't fill out seeker onboarding
  if (user.role !== 'seeker') redirect('/dashboard')

  // If they've already completed onboarding, send them to their dashboard
  const supabase = await createServerSupabaseClient()
  const { data: existing } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) redirect('/seeker')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
          Seeker onboarding
        </p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">
          Tell us about your journey
        </h1>
        <p className="mt-2 text-stone-500">
          This takes about two minutes. Your answers are private by default and help
          us surface guides who are genuinely the right fit for you.
        </p>
      </div>

      <SeekerOnboardingForm />
    </div>
  )
}
