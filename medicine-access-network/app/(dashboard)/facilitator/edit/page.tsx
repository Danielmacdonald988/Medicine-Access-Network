import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import type { FacilitatorProfile } from '@/lib/types'
import { FacilitatorOnboardingForm } from '@/components/forms/FacilitatorOnboardingForm'

export const metadata: Metadata = {
  title: 'Edit your guide profile',
  robots: { index: false, follow: false },
}

export default async function EditFacilitatorProfilePage() {
  const user = await requireRole('facilitator')
  const supabase = await createServerSupabaseClient()
  const { data: profile, error } = await supabase
    .from('facilitator_profiles')
    .select('id, user_id, display_name, bio, location, remote_available, modalities, years_experience, lineage_or_training, certifications, safety_practices, contraindications_acknowledged, donation_based, minimum_donation, hourly_rate, verification_status, visibility, avatar_url, image_paths, whatsapp_url, signal_url, telegram_url, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Your profile could not be loaded</h1>
        <p className="text-stone-600">Please try again before making changes.</p>
        <div className="flex gap-5 text-sm font-medium text-emerald-800">
          <Link href="/facilitator/edit" className="underline">Try again</Link>
          <Link href="/facilitator" className="underline">Back to dashboard</Link>
        </div>
      </div>
    )
  }
  if (!profile) redirect('/onboarding/facilitator')

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/facilitator" className="text-sm font-medium text-emerald-800 underline">
        Back to dashboard
      </Link>
      <div className="mb-8 mt-5">
        <h1 className="text-2xl font-bold text-stone-900">Edit your guide profile</h1>
        <p className="mt-2 text-stone-600">
          Update your photos, messaging links, or practice details. Your current information
          is filled in below. Choose the section you want to change, then select
          “Finish editing” to confirm and submit your updates for review.
        </p>
      </div>
      <FacilitatorOnboardingForm existingProfile={profile as FacilitatorProfile} />
    </div>
  )
}
